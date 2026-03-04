import { access, readFile, writeFile } from 'node:fs/promises';
import { glob } from 'tinyglobby';
import { unnormalizePath } from './paths';
import { wxt } from '../wxt';

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
