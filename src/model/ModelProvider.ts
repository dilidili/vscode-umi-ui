import * as vscode from 'vscode';
import * as resolveFrom from 'resolve-from';
import * as path from 'path';
import * as fs from 'fs';
import UmiUI from '../UmiUI';
import ConnectTemplate from '../templates/connect.d.tpl';
import mustache from 'mustache';

const CONNECT_FILE_NAME = 'connect.d.ts';

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
      if (!fs.existsSync(routeTreeItem.modelFilePath)) {
        if (path.basename(routeTreeItem.modelFilePath) === CONNECT_FILE_NAME) {
          vscode.window.showInformationMessage('No connect declaration files are available.', `Create ${CONNECT_FILE_NAME}`, 'No, thanks').then(option => {
            if (option === 'No, thanks') {
              return;
            } else {
              const models = this.getGlobalModels().map(model => {
                let name = path.basename(model, path.extname(model));
                name = name[0].toUpperCase() + name.slice(1);

                let relativePath = path.relative(path.dirname(routeTreeItem.modelFilePath), model);
                if (relativePath[0] !== '.') {
                  relativePath = './' + relativePath;
                }

                return {
                  name,
                  nameLowerCase: name.toLocaleLowerCase(),
                  relativePath,
                };
              });

              const connectContent = mustache.render(ConnectTemplate, {
                models: models,
                exportStates: models.map(v => `${v.name}ModelState`).join(', '),
              });

              fs.writeFile(routeTreeItem.modelFilePath, connectContent, 'utf8', () => {
                vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(routeTreeItem.modelFilePath));
              });
            }
          })
        }
      } else {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(routeTreeItem.modelFilePath));
      }
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

      // connect ts file.
      const connectFilePath = path.join(this._umiUI.service?._service.paths.absSrcPath, 'models', CONNECT_FILE_NAME);
      const connectTreeItem = new ConenctTreeItem(connectFilePath);

      // model files.
      const children = models.map((model) => new ModelTreeItem(model));
      children.push(connectTreeItem);

      return Promise.resolve(children);
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

class ConenctTreeItem extends ModelTreeItem {
  constructor(
    public readonly connectFilePath: string,
  ) {
    super(connectFilePath);
  }
} 