import path from 'node:path';
import glob from 'fast-glob';
import fs from 'fs-extra';
import { consola } from 'consola';
import pc from 'picocolors';

/**
 * Remove generated/temp files from the directory.
 *
 * @param root The directory to look for generated/temp files in. Defaults to `process.cwd()`. Can be relative to `process.cwd()` or absolute.
 */
export async function clean(root = process.cwd()) {
  consola.info('Cleaning Project');

  const tempDirs = [
    'node_modules/.vite',
    'node_modules/.cache',
    '**/.wxt',
    '.output/*',
  ];
  consola.debug('Looking for:', tempDirs.map(pc.cyan).join(', '));
  const directories = await glob(tempDirs, {
    cwd: path.resolve(root),
    absolute: true,
    onlyDirectories: true,
    deep: 2,
  });
  if (directories.length === 0) {
    consola.debug('No generated files found.');
    return;
  }

  consola.debug(
    'Found:',
    directories.map((dir) => pc.cyan(path.relative(root, dir))).join(', '),
  );
  for (const directory of directories) {
    await fs.rm(directory, { force: true, recursive: true });
    consola.debug('Deleted ' + pc.cyan(path.relative(root, directory)));
  }
}
