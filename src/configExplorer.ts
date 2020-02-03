import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { configFiles, getConfigFile } from './config';
import { exec } from 'child_process';

const ConfigDoc: {
  [key: string]: any,
// @ts-ignore
} = fs.readFileSync(path.join(__dirname, '../media/ConfigDoc.md'), 'utf8').split('### ').filter(v => !!v).reduce((r: Object, v: string): Object => (r[v.split('\n')[0]] = "### " + v.trim(), r), {});

vscode.languages.registerHoverProvider({
  language: 'typescript',
  scheme: 'file',
  pattern: `**/*{${configFiles.join(',')}}`
}, {
  provideHover(document, position, token) {
    const targetWord = document.getText(document.getWordRangeAtPosition(position));
    if (ConfigDoc[targetWord]) {
      return new vscode.Hover(new vscode.MarkdownString(ConfigDoc[targetWord]));
    } else {
      return null;
    }
  }
});

export class ConfigProvider implements vscode.TreeDataProvider<ConfigTreeItem> {

  private _onDidChangeTreeData: vscode.EventEmitter<ConfigTreeItem | undefined> = new vscode.EventEmitter<ConfigTreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<ConfigTreeItem | undefined> = this._onDidChangeTreeData.event;

  constructor(
    private _context: vscode.ExtensionContext,
  ) {
    vscode.commands.registerCommand('extension.openUmiConfig', () => {
      vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(getConfigFile(_context.globalState.get('cwd') || '')));
    });

    vscode.commands.registerCommand('extension.inspectWebpackConfig', (mode: (string | { command?: { arguments: [string, boolean] } }) = "dev", refresh = false) => {
      const globalState = this._context.globalState;

      if (!globalState.get('cwd')) {
        return;
      }

      // TODO: specify arguments from manifest.
      if (typeof mode !== 'string' && mode.command?.arguments) {
        [mode, refresh] = mode.command?.arguments;
        refresh = true;
      }

      const storageKey = `webpack.${mode}.config.js`;
      if (refresh) globalState.update(storageKey, undefined);

      const saveConfig = globalState.get(storageKey);
      if (!saveConfig) {
        vscode.window.setStatusBarMessage('Loading webpack config...', new Promise((c, e) => {
          exec(`APP_ROOT=${globalState.get('cwd')} umi inspect ${mode === 'prod' ? '--mode production' : ''}`, (err, stdout) => {
            if (!err) {
              globalState.update(storageKey, stdout);
              this.openWebpackConfig(storageKey);

              c();
            } else {
              e();
            }
          });
        }));
      } else {
        this.openWebpackConfig(storageKey);
      }
    });
  }

  private openWebpackConfig(storageKey: string) {
    const uri = vscode.Uri.parse(`umiui:/${storageKey}`);
    vscode.window.showTextDocument(uri, { preview: true, });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ConfigTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ConfigTreeItem): Thenable<ConfigTreeItem[]> {
    if (!element) {
      return Promise.resolve([
        new ConfigTreeItem('umirc', vscode.TreeItemCollapsibleState.None, {
          command: 'extension.openUmiConfig',
          title: '',
        }),
        new ConfigTreeItem('webpack config', vscode.TreeItemCollapsibleState.Expanded),
      ]);
    } else if (element.label === 'webpack config') {
      return Promise.resolve([
        new ConfigTreeItem('dev', vscode.TreeItemCollapsibleState.None, {
          command: 'extension.inspectWebpackConfig',
          title: '',
          arguments: ['dev', false],
        }, 'webpackDevConfig'),

        new ConfigTreeItem('prod', vscode.TreeItemCollapsibleState.None, {
          command: 'extension.inspectWebpackConfig',
          title: '',
          arguments: ['prod', false],
        }, 'webpackProdConfig')
      ]);
    } else {
      return Promise.resolve([]);
    }
  }
}

export class ConfigTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command,
    public readonly contextValue?: string
  ) {
    super(label, collapsibleState);
  }
}