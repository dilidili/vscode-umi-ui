import * as vscode from 'vscode';

export const ensureImport = (exportName: string, from: string, document: vscode.TextDocument): vscode.TextEdit[] => {
  const ret: vscode.TextEdit[] = [];
  let lastImportLine = 0;
  let hasImported = false;

  for (let index = 0; index < document.lineCount; index++) {
    const line = document.lineAt(index);
    if (line.text && line.text.startsWith('import')) {
      lastImportLine = index;

      if (line.text.indexOf(exportName) > -1) {
        hasImported = true;
        break;
      }
    } else {
      break;
    }
  }

  if (!hasImported) {
    const lastCharacter = document.lineAt(lastImportLine).text.length;
    ret.push(
      new vscode.TextEdit(
        new vscode.Range(lastImportLine, lastCharacter, lastImportLine, lastCharacter),
        `\nimport { ${exportName} } from '${from}';`
      )
    );
  }

  return ret;
}