import path from 'node:path';
import glob from 'fast-glob';
import fs from 'fs-extra';
import pc from 'picocolors';
import { InlineConfig } from '~/types';
import { registerWxt, wxt } from './wxt';

/**
 * Remove generated/temp files from the directory.
 *
 * @param config Optional config that will override your `<root>/wxt.config.ts`.
 *
 * @example
 * await clean();
 */
export async function clean(config?: InlineConfig) {
  await registerWxt('build', config);
  wxt.logger.info('Cleaning Project');

  const root = wxt.config.root;

  const tempDirs = [
    'node_modules/.vite',
    'node_modules/.cache',
    '**/.wxt',
    `${path.relative(root, wxt.config.outBaseDir)}/*`,
  ];
  wxt.logger.debug('Looking for:', tempDirs.map(pc.cyan).join(', '));
  const directories = await glob(tempDirs, {
    cwd: root,
    absolute: true,
    onlyDirectories: true,
    deep: 2,
  });
  if (directories.length === 0) {
    wxt.logger.debug('No generated files found.');
    return;
  }

  wxt.logger.debug(
    'Found:',
    directories.map((dir) => pc.cyan(path.relative(root, dir))).join(', '),
  );
  for (const directory of directories) {
    await fs.rm(directory, { force: true, recursive: true });
    wxt.logger.debug('Deleted ' + pc.cyan(path.relative(root, directory)));
  }
}
