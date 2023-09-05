import path from 'node:path';
import { defineCommand } from '../utils/defineCommand';
import glob from 'fast-glob';
import fs from 'fs-extra';
import { consola } from 'consola';
import pc from 'picocolors';

export const clean = defineCommand<
  [
    root: string | undefined,
    flags: {
      debug?: boolean;
    },
  ]
>(async (root, flags) => {
  consola.info('Cleaning Project');
  const cwd = root ? path.resolve(root) : process.cwd();
  const tempDirs = [
    'node_modules/.vite',
    'node_modules/.cache',
    '**/.wxt',
    '.output/*',
  ];
  consola.debug('Looking for:', tempDirs.map(pc.cyan).join(', '));
  const directories = await glob(tempDirs, {
    cwd,
    absolute: true,
    onlyDirectories: true,
    deep: 2,
  });
  consola.debug(
    'Found:',
    directories
      .map((dir) => pc.cyan(path.relative(process.cwd(), dir)))
      .join(', '),
  );

  for (const directory of directories) {
    await fs.rm(directory, { force: true, recursive: true });
    consola.debug(
      'Deleted ' + pc.cyan(path.relative(process.cwd(), directory)),
    );
  }
});
