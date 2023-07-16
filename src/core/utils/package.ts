import { resolve } from 'node:path';
import { InternalConfig } from '../types';
import fs from 'fs-extra';

/**
 * Read the project's package.json.
 *
 * TODO: look in root and up directories until it's found
 */
export async function getPackageJson(
  config: InternalConfig,
): Promise<Partial<Record<string, any>> | undefined> {
  const file = resolve(config.root, 'package.json');
  try {
    return await fs.readJson(file);
  } catch (err) {
    config.logger.debug(
      `Failed to read package.json at: ${file}. Returning undefined.`,
    );
    return {};
  }
}
