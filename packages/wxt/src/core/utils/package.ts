import { resolve, dirname } from 'node:path';
import fs from 'fs-extra';
import { wxt } from '../wxt';

type PackageJson = {
  name: string;
  version?: string;
  description: string;
  author?: string;
  main: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  shortName?: string;
  [key: string]: unknown;
};

/**
 * Recursively searches for package.json up directory tree
 */
const findPackageJson = async (dir: string): Promise<string | undefined> => {
  const path = resolve(dir, 'package.json');
  try {
    await fs.access(path);
    return path;
  } catch {
    const parent = dirname(dir);
    return parent === dir ? undefined : findPackageJson(parent);
  }
};

/**
 * Reads and returns package.json contents, searching up directories if needed
 */
export const getPackageJson = async (): Promise<PackageJson> => {
  try {
    const path = await findPackageJson(wxt.config.root);
    return path ? await fs.readJson(path) : {};
  } catch (err) {
    wxt.logger.debug('Failed to read package.json', err);
    return {
      name: '',
      version: '',
      description: '',
      author: '',
      main: '',
      types: '',
      scripts: {},
      dependencies: {},
      devDependencies: {},
      peerDependencies: {},
    };
  }
};
