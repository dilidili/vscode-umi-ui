import * as vscode from 'vscode';
import UmiUI from './UmiUI';

export function activate(context: vscode.ExtensionContext) {
	const umiUI = new UmiUI(context);

	let disposable = vscode.commands.registerCommand('extension.umiUI', async () => {
		await umiUI.start();
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
	console.log('deactivate')
}
