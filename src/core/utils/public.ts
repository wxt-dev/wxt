import { InternalConfig } from '../types';
import fs from 'fs-extra';
import glob from 'fast-glob';
import { unnormalizePath } from './paths';

/**
 * Get all the files in the project's public directory. Returned paths are relative to the
 * `config.publicDir`.
 */
export async function getPublicFiles(
  config: InternalConfig,
): Promise<string[]> {
  if (!(await fs.exists(config.publicDir))) return [];

  const files = await glob('**/*', { cwd: config.publicDir });
  return files.map(unnormalizePath);
}
