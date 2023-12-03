import { InternalConfig } from '~/types';
import fs from 'fs-extra';
import glob from 'fast-glob';
import { unnormalizePath } from './paths';
import path from 'node:path';

/**
 * Only write the contents to a file if it results in a change. This prevents unnecessary file
 * watchers from being triggered, like WXT's dev server or the TS language server in editors.
 *
 * @param file The file to write to.
 * @param newContents The new text content to write.
 */
export async function writeFileIfDifferent(
  file: string,
  newContents: string,
): Promise<void> {
  const existingContents = await fs
    .readFile(file, 'utf-8')
    .catch(() => undefined);

  if (existingContents !== newContents) {
    await fs.writeFile(file, newContents);
  }
}

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
