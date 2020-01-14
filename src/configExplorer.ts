import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

const configFiles = ['.umirc.ts', '.umirc.js', 'config/config.ts', 'config/config.js'];
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

export function getConfigFile(cwd: string): string {
  const validFiles = configFiles.filter(f => fs.existsSync(path.join(cwd, f)));

  if (validFiles[0]) {
    return path.join(cwd, validFiles[0]);
  }

  return '';
}

function getConfigWebviewContent() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configuration</title>
    <style>
      iframe {
        width: 90vw;
        height: 98vh;
        margin-top: 5px;
      }
    </style>
</head>
<body>
  <iframe src="https://umijs.org/zh/config/" />
</body>
</html>`;
}

export class ConfigProvider implements vscode.TreeDataProvider<ConfigTreeItem> {

  private _onDidChangeTreeData: vscode.EventEmitter<ConfigTreeItem | undefined> = new vscode.EventEmitter<ConfigTreeItem | undefined>();
  readonly onDidChangeTreeData: vscode.Event<ConfigTreeItem | undefined> = this._onDidChangeTreeData.event;

  constructor(
    private _context: vscode.ExtensionContext,
  ) {
    vscode.commands.registerCommand('extension.openUmiConfig', () => {
      vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(getConfigFile(_context.globalState.get('cwd') || ''))).then(() => {
        const panel = vscode.window.createWebviewPanel(
          'umiConfiguration',
          'Configuration',
          {
            viewColumn: vscode.ViewColumn.Beside,
            preserveFocus: true,
          }
        );
        panel.webview.html = getConfigWebviewContent();
      });
    });
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ConfigTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ConfigTreeItem): Thenable<ConfigTreeItem[]> {
    return Promise.resolve([
      new ConfigTreeItem('umirc', vscode.TreeItemCollapsibleState.None, {
        command: 'extension.openUmiConfig',
        title: '',
      }),
    ]);
  }
}

export class ConfigTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label);
  }
}