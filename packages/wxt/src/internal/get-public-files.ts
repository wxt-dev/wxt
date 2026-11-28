import { glob } from 'tinyglobby';

import { pathExists } from '../internal-utils/fs-utils';
import { unnormalizePath } from '../internal-utils/path-utils';
import { wxt } from './wxt';

export async function getPublicFiles(): Promise<string[]> {
  if (!(await pathExists(wxt.config.publicDir))) return [];

  const files = await glob('**/*', {
    cwd: wxt.config.publicDir,
    expandDirectories: false,
  });
  return files.map(unnormalizePath);
}
