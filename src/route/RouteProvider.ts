import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { babelRecast } from './babelPlugin';
import { Route } from '../Service';
import UmiUI from '../UmiUI';
import { getConfigFile } from '../config';
import { removeRoutePlugin, addRoutePlugin } from './babelPlugin';

export type SourceLocation = {
  end: {
    column: number;
    line: number;
  },
  start: {
    column: number;
    line: number;
  }
}

const findDiffStart = (content: string, newContent: string): number => {
  const contentLines = content.split('\n');
  const newContentLines = newContent.split('\n');
  let i = 0;

  while(i < contentLines.length && i< newContentLines.length) {
    if (contentLines[i] !== newContentLines[i]) {
      return i;
    } else {
      i++;
    }
  }

  return 0;
}

export class RouteProvider implements vscode.TreeDataProvider<RouteTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<RouteTreeItem | undefined> = new vscode.EventEmitter<RouteTreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<RouteTreeItem | undefined> = this._onDidChangeTreeData.event;

  constructor(
    private _context: vscode.ExtensionContext,
    private _umiUI: UmiUI,
  ) {
    // open component file correspond to a route
    vscode.commands.registerCommand('extension.openRouteComponentDocument', (componentPath: string) => {
      componentPath = path.join(_context.globalState.get('cwd') || '', componentPath);
      componentPath = require.resolve(componentPath);

      if (componentPath) {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(componentPath));
      }
    });

    // refresh route config
    vscode.commands.registerCommand('extension.refreshRoutes', () => {
      this._umiUI.service?.refreshRoutes();
    });

    // add route config
    vscode.commands.registerCommand('extension.addRoute', (item) => {
      const cwd = this._context.globalState.get('cwd') as string;

      if (cwd) {
        const configFilePath = getConfigFile(cwd);

        fs.readFile(configFilePath, { encoding: 'utf8' }, async (err, content) => {
          if (!err) {
            const newContent = await babelRecast(content, {
              plugins: [require.resolve('@babel/plugin-syntax-typescript')],
            }, {
              plugins: [require.resolve('@babel/plugin-syntax-typescript'), addRoutePlugin(item)],
            });

            // find cursor position
            let diffStart = findDiffStart(content, newContent);

            fs.writeFile(configFilePath, newContent, () => {
              this._umiUI.service?.refreshRoutes();

              vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(configFilePath), {
                selection: new vscode.Selection(new vscode.Position(diffStart, 0), new vscode.Position(diffStart, 0)),
              });
            });
          }
        });
      }
    })

    // remove route config
    vscode.commands.registerCommand('extension.removeRoute', (item) => {
      const cwd = this._context.globalState.get('cwd') as string;
      if (cwd) {
        const configFilePath = getConfigFile(cwd);

        fs.readFile(configFilePath, { encoding: 'utf8' }, async (err, content) => {
          if (!err) {
            const newContent = await babelRecast(content, {
              plugins: [require.resolve('@babel/plugin-syntax-typescript')],
            }, {
              plugins: [require.resolve('@babel/plugin-syntax-typescript'), removeRoutePlugin(item)],
            });

            let diffStart = findDiffStart(content, newContent);

            fs.writeFile(configFilePath, newContent, () => {
              this._umiUI.service?.refreshRoutes();

              vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(configFilePath), {
                selection: new vscode.Selection(new vscode.Position(diffStart, 0), new vscode.Position(diffStart, 0)),
              });
            });
          }
        });
      }
    });

    this._umiUI.service?.routeChangeEvent.event(() => {
      this._onDidChangeTreeData.fire();
    });
  }

  getTreeItem(element: RouteTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: RouteTreeItem | undefined): vscode.ProviderResult<RouteTreeItem[]> {
    if (!element) {
      const routes = this._umiUI.service?.routes || [];
      return Promise.resolve(routes.map((route, index) => new RouteTreeItem(route, '' + index)));
    } else {
      return element.getChildren();
    }
  }
}

export class RouteTreeItem extends vscode.TreeItem {
  public readonly command?: vscode.Command;

  constructor(
    public readonly route: Route,
    public readonly keyPath: string,
  ) {
    super(
      route.redirect ? `${route.path} -> ${route.redirect}` : route.path || '*',
      route.routes && route.routes.length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None,
    );

    this.contextValue = 'routeTreeItem';

    this.command = !route.redirect ? {
      title: 'View Route Component',
      command: 'extension.openRouteComponentDocument',
      arguments: [route.component],
    } : undefined;
  }

  getChildren() {
    const children = this.route.routes ? this.route.routes.map((route, index) => new RouteTreeItem(route, this.keyPath + '.' + index)) : [];
    return Promise.resolve(children);
  }
}