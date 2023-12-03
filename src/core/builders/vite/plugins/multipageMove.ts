import * as vite from 'vite';
import { Entrypoint, InternalConfig } from '~/types';
import { dirname, extname, resolve, join } from 'node:path';
import { getEntrypointBundlePath } from '~/core/utils/entrypoints';
import fs, { ensureDir } from 'fs-extra';
import { normalizePath } from '~/core/utils/paths';

/**
 * Ensures the HTML files output by a multipage build are in the correct location. This does two
 * things:
 *
 * 1. Moves the HMTL files to their final location at `<outDir>/<entrypoint.name>.html`.
 * 2. Updates the bundle so it summarizes the files correctly in the returned build output.
 *
 * Assets (JS and CSS) are output to the `<outDir>/assets` directory, and don't need to be modified.
 * HTML files access them via absolute URLs, so we don't need to update any import paths in the HTML
 * files either.
 *
 * THIS PLUGIN SHOULD ONLY BE APPLIED TO MULTIPAGE BUILDS. It should not be added to every build.
 */
export function multipageMove(
  entrypoints: Entrypoint[],
  config: Omit<InternalConfig, 'builder'>,
): vite.Plugin {
  return {
    name: 'wxt:multipage-move',
    async writeBundle(_, bundle) {
      for (const oldBundlePath in bundle) {
        // oldBundlePath = 'entrypoints/popup.html' or 'entrypoints/options/index.html'

        // Find a matching entrypoint - oldBundlePath is the same as end end of the input path.
        const entrypoint = entrypoints.find(
          (entry) => !!normalizePath(entry.inputPath).endsWith(oldBundlePath),
        );
        if (entrypoint == null) {
          config.logger.debug(
            `No entrypoint found for ${oldBundlePath}, leaving in chunks directory`,
          );
          continue;
        }

        // Get the new bundle path
        const newBundlePath = getEntrypointBundlePath(
          entrypoint,
          config.outDir,
          extname(oldBundlePath),
        );
        if (newBundlePath === oldBundlePath) {
          config.logger.debug(
            'HTML file is already in the correct location',
            oldBundlePath,
          );
          continue;
        }

        // Move file and update bundle
        // Do this inside a mutex lock so it only runs one at a time for concurrent multipage builds
        const oldAbsPath = resolve(config.outDir, oldBundlePath);
        const newAbsPath = resolve(config.outDir, newBundlePath);
        await ensureDir(dirname(newAbsPath));
        await fs.move(oldAbsPath, newAbsPath, { overwrite: true });

        const renamedChunk = {
          ...bundle[oldBundlePath],
          fileName: newBundlePath,
        };
        delete bundle[oldBundlePath];
        bundle[newBundlePath] = renamedChunk;
      }

      // Remove directories that were created
      removeEmptyDirs(config.outDir);
    },
  };
}

/**
 * Recursively remove all directories that are empty/
 */
export async function removeEmptyDirs(dir: string): Promise<void> {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      await removeEmptyDirs(filePath);
    }
  }

  try {
    await fs.rmdir(dir);
  } catch {
    // noop on failure - this means the directory was not empty.
  }
}
