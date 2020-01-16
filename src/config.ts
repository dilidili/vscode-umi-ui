import * as path from 'path';
import * as fs from 'fs';

export const configFiles = ['.umirc.ts', '.umirc.js', 'config/config.ts', 'config/config.js'];

export function getConfigFile(cwd: string): string {
  const validFiles = configFiles.filter(f => fs.existsSync(path.join(cwd, f)));

  if (validFiles[0]) {
    return path.join(cwd, validFiles[0]);
  }

  return '';
}