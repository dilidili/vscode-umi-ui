import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { Route } from '../Service';
import UmiUI from '../UmiUI';

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
      return Promise.resolve(routes.map(route => new RouteTreeItem(route)));
    } else {
      return element.getChildren();
    }
  }
}

export class RouteTreeItem extends vscode.TreeItem {
  public readonly command?: vscode.Command;

  constructor(
    public readonly route: Route,
  ) {
    super(
      route.redirect ? `${route.path} -> ${route.redirect}` : route.path || '*',
      route.routes && route.routes.length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None
    );

    this.command = !route.redirect ? {
      title: 'View Route Component',
      command: 'extension.openRouteComponentDocument',
      arguments: [route.component],
    } : undefined;
  }

  getChildren() {
    const children = this.route.routes ? this.route.routes.map(route => new RouteTreeItem(route)) : [];
    return Promise.resolve(children);
  }
}