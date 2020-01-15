import * as vscode from "vscode";

const MyProvider = class implements vscode.TextDocumentContentProvider {
  constructor(private _context: vscode.ExtensionContext) {}

  provideTextDocumentContent(uri: vscode.Uri): string {
    if (uri.path === '/webpack.dev.config.js') {
      return this._context.globalState.get('webpack.dev.config.js') || '';
    }
    return '';
  }
};

export const activate = (context: vscode.ExtensionContext) => {
  vscode.workspace.registerTextDocumentContentProvider('umiui', new MyProvider(context));
};