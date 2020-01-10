import { Terminal, ExtensionContext, window, workspace, commands, WorkspaceFolder } from 'vscode';
import { Socket } from './Socket';

const { readFileSync } = require('fs');
const path = require('path');

export default class UmiUI {
  private _terminal: Terminal | undefined;
  private _sock: Socket;

  constructor(
    private _context: ExtensionContext,
  ) {
    this._sock = new Socket('http://localhost:3001/umiui');
  }

  async validateUmiProject(projects: WorkspaceFolder[], depressError = true) {
    if (projects && projects.length > 0) {
      for (let i = 0; i < projects.length; i++) {
        const project = projects[i];

        try {
          const pkg = readFileSync(await project.uri.with({ path: path.join(project.uri.fsPath, 'package.json') }).fsPath);
          const pkgJSON = JSON.parse(pkg);
          const containUmi = Object.keys({ ...(pkgJSON.dependencies || {}), ...(pkgJSON.devDependencies || {}) }).indexOf('umi') >= 0;

          if (containUmi) {
            return Promise.resolve(project);
          }
        } catch (err) {
          if (!depressError) {
            window.showErrorMessage('Please select a valid Umi project');
          }
          console.error(err);
        }
      }
    }

    return Promise.resolve(null);
  }

  async getUmiProject(): Promise<WorkspaceFolder | null | undefined> {
    let validProject = await this.validateUmiProject(workspace.workspaceFolders || []);

    if (!validProject) {
      // select umi project
      const selectedFolders = await window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select Umi Project'
      });
      if (selectedFolders && selectedFolders.length > 0) {
        const projectUri = selectedFolders[0];

        if (projectUri) {
          return new Promise((c, e) => {
            workspace.updateWorkspaceFolders(workspace.workspaceFolders ? workspace.workspaceFolders.length : 0, null, { uri: projectUri });
            const listenWorkspaceChange = workspace.onDidChangeWorkspaceFolders(async (e) => {
              if (e.added && e.added.length) {
                listenWorkspaceChange.dispose();

                validProject = await this.validateUmiProject(e.added as WorkspaceFolder[], false);
                if (!validProject) {
                  window.showErrorMessage('Please select a valid Umi project');
                  c(null);
                } else {
                  c(validProject);
                }
              }
            });
          });
        } else {
          return Promise.resolve(null);
        }
      }
    } else {
      return Promise.resolve(validProject);
    }
  }

  openWorkspace(workspace: WorkspaceFolder) {
    const { _terminal, } = this;


    if (!_terminal) {
      this._terminal = window.createTerminal('Umi UI');
      this._terminal.show();
      this._terminal.sendText('UMI_UI_BROWSER=none umi ui');
    }

    this._sock.fetch({
      'type': '@@project/list',
    }, '@@project/list/success').then((res) => {
      const resObj = JSON.parse(res);

      this._sock.send({
        'type': '@@project/add',
        'payload': {
          'path': workspace.uri.fsPath,
          'name': workspace.name,
        },
      });
    });
  }

  async start() {
    const umiWorkspaceFolder = await this.getUmiProject();
    if (!umiWorkspaceFolder) return;

    this.openWorkspace(umiWorkspaceFolder);
  }
};