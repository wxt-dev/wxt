import { resolve } from 'node:path';
import fs from 'fs-extra';
import { wxt } from '../wxt';

/**
 * Read the project's package.json.
 *
 * TODO: look in root and up directories until it's found
 */
export async function getPackageJson(): Promise<
  Partial<Record<string, any>> | undefined
> {
  const file = resolve(wxt.config.root, 'package.json');
  try {
    return await fs.readJson(file);
  } catch (err) {
    wxt.logger.debug(
      `Failed to read package.json at: ${file}. Returning undefined.`,
      err,
    );
    return {};
  }
}
