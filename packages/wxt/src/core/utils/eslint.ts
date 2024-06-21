import { resolve } from 'node:path';
import fs from 'fs-extra';
import { wxt } from '../wxt';

export async function getEslintVersion(): Promise<string[]> {
  try {
    const packageJsonPath = resolve(
      wxt.config.root,
      'node_modules/eslint/package.json',
    );
    const eslintPackageJson = await fs.readJson(packageJsonPath);
    return eslintPackageJson.version?.split('.') ?? [];
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }

    throw new Error('Could not get ESLint version.');
  }
}
