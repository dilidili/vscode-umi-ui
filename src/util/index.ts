import { spawn, SpawnOptions, fork } from 'child_process';

export const runCommand = (script: string, options: SpawnOptions = {}, ipc = false) => {
  options.env = {
    ...options.env,
    FORCE_COLOR: '1',
  };

  options.cwd = options.cwd || process.cwd();

  if (process.platform !== 'win32' || !ipc) {
    options.stdio = ipc ? [null, null, null, 'ipc'] : 'pipe';
    options.env = {
      ...options.env,
      FORCE_COLOR: '1',
    };

    options.cwd = options.cwd || process.cwd();

    let sh = 'sh';
    let shFlag = '-c';

    const proc = spawn(sh, [shFlag, script], options);
    return proc;
  }

  options.stdio = 'pipe';
  const binPath = require.resolve(
    script.indexOf('umi') > -1 ? 'umi/bin/umi' : '@alipay/bigfish/bin/bigfish',
    {
      paths: [options.cwd],
    },
  );
  const child = fork(binPath, ['dev'], options);
  return child;
};