import * as vscode from 'vscode';
import { ensureImport } from './util/edit';

export default (context: vscode.ExtensionContext) => {
  let tsxProvider = vscode.languages.registerCompletionItemProvider({ pattern: '**/*.tsx' }, {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
      const connectCompletion = new vscode.CompletionItem('umiconnect', vscode.CompletionItemKind.Snippet);
      connectCompletion.insertText = new vscode.SnippetString(`connect(({}: ConnectState) => {
  return {};
})(\${1});`);
      // commandCompletion.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
      const ensureImportConnectState = ensureImport('ConnectState', '@/models/connect', document);
      connectCompletion.additionalTextEdits = ensureImportConnectState;

      return [
        connectCompletion,
      ];
    },
  });

  context.subscriptions.push(tsxProvider);
}