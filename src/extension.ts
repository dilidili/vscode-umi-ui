import * as vscode from 'vscode';
import { ConfigProvider, } from './configExplorer';
import { RouteProvider } from './route/RouteProvider';
import { activate as activateVirtualDocument } from './TextDocumentProvider';
import UmiUI from './UmiUI';

export function activate(context: vscode.ExtensionContext) {
	const umiUI = new UmiUI(context);

	activateVirtualDocument(context);

	// config
	const configProvider = new ConfigProvider(context);
	vscode.window.registerTreeDataProvider('config', configProvider);

	// route
	new RouteProvider(context, umiUI);

	let disposable = vscode.commands.registerCommand('extension.umiUI', async () => {
		await umiUI.start();
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
	console.log('deactivate')
}
