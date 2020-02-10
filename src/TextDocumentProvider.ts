import * as vscode from "vscode";
import UmiUI from "./UmiUI";

export class UmiUITextDocumentContentProvider implements vscode.TextDocumentContentProvider {
  // emitter and its event
  public onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
  public onDidChange = this.onDidChangeEmitter.event;

  constructor(private _context: vscode.ExtensionContext) {}

  provideTextDocumentContent(uri: vscode.Uri): string {
    if (uri.path === '/webpack.dev.config.js') {
      return this._context.globalState.get('webpack.dev.config.js') || '';
    }

    if (uri.path === '/webpack.prod.config.js') {
      return this._context.globalState.get('webpack.prod.config.js') || '';
    }

    return '';
  }
};

export const activate = (context: vscode.ExtensionContext, umiui: UmiUI) => {
  const TDCprovider = new UmiUITextDocumentContentProvider(context);
  vscode.workspace.registerTextDocumentContentProvider('umiui', TDCprovider);

  umiui.TDCprovider = TDCprovider;
};