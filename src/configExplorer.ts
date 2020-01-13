import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function getConfigFile(cwd: string): string {
	const files = ['.umirc.ts', '.umirc.js', 'config/config.ts', 'config/config.js'];
	const validFiles = files.filter(f => fs.existsSync(path.join(cwd, f)));

	if (validFiles[0]) {
		return path.join(cwd, validFiles[0]);
	}

	return '';
}

export class ConfigProvider implements vscode.TreeDataProvider<ConfigTreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<ConfigTreeItem | undefined> = new vscode.EventEmitter<ConfigTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<ConfigTreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(
		private _context: vscode.ExtensionContext,
	) {
		vscode.commands.registerCommand('extension.openUmiConfig', () => {
			vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(getConfigFile(_context.globalState.get('cwd') || '')))
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
			new ConfigTreeItem('Umi Config', vscode.TreeItemCollapsibleState.None, {
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