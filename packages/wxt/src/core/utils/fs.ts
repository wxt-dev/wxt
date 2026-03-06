import { access, readFile, writeFile } from 'node:fs/promises';
import { glob } from 'tinyglobby';
import { wxt } from '../wxt';
import { unnormalizePath } from './paths';

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readJson<T = any>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf-8'));
}

/**
 * Only write the contents to a file if it results in a change. This prevents
 * unnecessary file watchers from being triggered, like WXT's dev server or the
 * TS language server in editors.
 *
 * @param file The file to write to.
 * @param newContents The new text content to write.
 */
export async function writeFileIfDifferent(
  file: string,
  newContents: string,
): Promise<void> {
  const existingContents = await readFile(file, 'utf-8').catch(() => undefined);

  if (existingContents !== newContents) {
    await writeFile(file, newContents);
  }
}

export async function getPublicFiles(): Promise<string[]> {
  if (!(await pathExists(wxt.config.publicDir))) return [];

  const files = await glob('**/*', {
    cwd: wxt.config.publicDir,
    expandDirectories: false,
  });
  return files.map(unnormalizePath);
}
