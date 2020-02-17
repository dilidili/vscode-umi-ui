import * as vscode from 'vscode';
import * as resolveFrom from 'resolve-from';
import * as path from 'path';
import UmiUI from '../UmiUI';

export class ModelProvider implements vscode.TreeDataProvider<ModelTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ModelTreeItem | undefined> = new vscode.EventEmitter<ModelTreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<ModelTreeItem | undefined> = this._onDidChangeTreeData.event;
  private _routeViewer: vscode.TreeView<ModelTreeItem>; 

  constructor(
    private _context: vscode.ExtensionContext,
    private _umiUI: UmiUI,
  ) {
    this._routeViewer = vscode.window.createTreeView('model', { treeDataProvider: this });

    // open model file 
    vscode.commands.registerCommand('extension.openModelFile', (routeTreeItem: ModelTreeItem) => {
      vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(routeTreeItem.modelFilePath));
    });

    this._umiUI.service?.routeChangeEvent.event(() => {
      this._onDidChangeTreeData.fire();
    });
  }

  getGlobalModels(): string[] {
    if (typeof this._context.globalState.get('cwd') === 'string') {
      const cwd: string = this._context.globalState.get('cwd') || '';

      const servicePath = resolveFrom.silent(cwd, 'umi-plugin-dva');
      if (servicePath) {
        const dvaPlugin = require(servicePath);
        let dvaPluinApi: any = null;
        try {
          dvaPluinApi = this._umiUI.service?._service.plugins.find((v: any) => v.id === 'umi-plugin-react:dva')._api;
        } catch(err) {
          dvaPluinApi = null;
        }

        if (dvaPluinApi) {
          return dvaPlugin.getGlobalModels(dvaPluinApi, true);
        }
      }
    }

    return []; 
  }

  getTreeItem(element: ModelTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ModelTreeItem | undefined): vscode.ProviderResult<ModelTreeItem[]> {
    if (!element) {
      const models = this.getGlobalModels();
      return Promise.resolve(models.map((model) => new ModelTreeItem(model)));
    }

    return [];
  }
}

export class ModelTreeItem extends vscode.TreeItem {
  public readonly command?: vscode.Command;

  constructor(
    public readonly modelFilePath: string,
  ) {
    super(
      path.basename(modelFilePath, path.extname(modelFilePath)),
      vscode.TreeItemCollapsibleState.None,
    );

    this.command = {
      title: 'View Model File',
      command: 'extension.openModelFile',
      arguments: [this],
    };
  }
}