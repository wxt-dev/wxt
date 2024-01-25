import { execa, Options } from 'execa';
import managePath from 'manage-path';
import { resolve } from 'node:path';
import { InternalConfig } from '~/types';

const managedPath = managePath(process.env);

/**
 * Wrapper around `execa` with a modified `PATH` variable containing CLI tools from WXT's dependencies.
 */
export const exec = (
  config: InternalConfig,
  file: string,
  args?: readonly string[],
  options?: Options,
) => {
  // Reset so the same path isn't added multiple times
  managedPath.restore();

  // Add subdependency path for PNPM shamefully-hoist=false
  managedPath.push(resolve(config.root, 'node_modules/wxt/node_modules/.bin'));

  return execa(file, args, options);
};
