import { glob } from 'tinyglobby';
import { wxt } from '../wxt';
import { unnormalizePath } from './paths';
import { pathExists } from './fs';

export async function getPublicFiles(): Promise<string[]> {
  if (!(await pathExists(wxt.config.publicDir))) return [];

  const files = await glob('**/*', {
    cwd: wxt.config.publicDir,
    expandDirectories: false,
  });
  return files.map(unnormalizePath);
}
