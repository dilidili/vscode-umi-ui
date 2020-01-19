import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as resolveFrom from 'resolve-from';
import { Route } from '../Service';
import UmiUI from '../UmiUI';
import { getConfigFile } from '../config';
import { removeRoutePlugin } from './babelPlugin';
import { fstat } from 'fs';

export class RouteProvider implements vscode.TreeDataProvider<RouteTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<RouteTreeItem | undefined> = new vscode.EventEmitter<RouteTreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<RouteTreeItem | undefined> = this._onDidChangeTreeData.event;

  constructor(
    private _context: vscode.ExtensionContext,
    private _umiUI: UmiUI,
  ) {
    vscode.commands.registerCommand('extension.openRouteComponentDocument', (componentPath: string) => {
      componentPath = path.join(_context.globalState.get('cwd') || '', componentPath);
      componentPath = require.resolve(componentPath);

      if (componentPath) {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(componentPath));
      }
    });

    vscode.commands.registerCommand('extension.refreshRoutes', () => {
      this._umiUI.service?.refreshRoutes();
    });

    vscode.commands.registerCommand('extension.removeRoute', (item) => {
      const cwd = this._context.globalState.get('cwd') as string;
      if (cwd) {
        const configFilePath = getConfigFile(cwd);
        const babelPath = resolveFrom.silent(cwd, '@babel/core');
        const babelPresetTypescriptPath = resolveFrom.silent(cwd, '@babel/plugin-syntax-typescript');

        if (babelPath) {
          const babel = require(babelPath);
          const { ast, code } = require(babelPath).transformFileSync(configFilePath, {
            plugins: [babelPresetTypescriptPath, removeRoutePlugin(item)],
            ast: true
          });

          const { code: newCode } = babel.transformFromAstSync(ast, code, {
            filename: 'file.ts',
            plugins: [
              babelPresetTypescriptPath,
            ]
          });

          if (code) {
            fs.writeFileSync(configFilePath, code, {
              encoding: 'utf8',
            });
          }
        }
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