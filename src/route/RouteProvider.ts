import * as vscode from 'vscode';
import { Route } from '../Service';
import UmiUI from '../UmiUI';

export class RouteProvider implements vscode.TreeDataProvider<RouteTreeItem> {
  constructor(
    private _context: vscode.ExtensionContext,
    private _umiUI: UmiUI,
  ) {
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
  constructor(
    public readonly route: Route,
  ) {
    super(route.path, route.routes && route.routes.length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None);
  }

  getChildren() {
    const children = this.route.routes ? this.route.routes.map(route => new RouteTreeItem(route)) : [];
    return Promise.resolve(children);
  }
}