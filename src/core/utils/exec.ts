import type { Options } from 'execa';
import managePath from 'manage-path';
import { resolve } from 'node:path';
import { wxt } from './wxt';

const managedPath = managePath(process.env);

/**
 * Wrapper around `execa` with a modified `PATH` variable containing CLI tools from WXT's dependencies.
 */
export const exec = async (
  file: string,
  args?: readonly string[],
  options?: Options,
) => {
  // Reset so the same path isn't added multiple times
  managedPath.restore();

  // Add subdependency path for PNPM shamefully-hoist=false
  managedPath.push(
    resolve(wxt.config.root, 'node_modules/wxt/node_modules/.bin'),
  );

  const { execa } = await import('execa');
  return await execa(file, args, options);
};
