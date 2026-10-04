import { glob } from 'tinyglobby';
import { wxt } from './wxt';
import { unnormalizePath } from '../internal-utils/path-utils';
import { pathExists } from '../internal-utils/fs-utils';

export async function getPublicFiles(): Promise<string[]> {
  if (!(await pathExists(wxt.config.publicDir))) return [];

  const files = await glob('**/*', {
    cwd: wxt.config.publicDir,
    expandDirectories: false,
  });
  return files.map(unnormalizePath);
}
