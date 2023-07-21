import * as vite from 'vite';
import { Entrypoint, InternalConfig } from '../types';
import { getEntrypointBundlePath } from '../utils/entrypoints';

/**
 * Rename CSS entrypoint outputs to ensure a JS file is not generated, and that the CSS file is
 * placed in the correct place.
 *
 * It:
 * 1. Renames CSS files to their final paths
 * 2. Removes the JS file that get's output by lib mode
 *
 * THIS PLUGIN SHOULD ONLY BE APPLIED TO CSS LIB MODE BUILDS. It should not be added to every build.
 */
export function cssEntrypoints(
  entrypoint: Entrypoint,
  config: InternalConfig,
): vite.Plugin {
  return {
    name: 'wxt:css-entrypoint',
    config() {
      return {
        build: {
          rollupOptions: {
            output: {
              assetFileNames: () =>
                getEntrypointBundlePath(entrypoint, config.outDir, '.css'),
            },
          },
        },
      };
    },
    generateBundle(_, bundle) {
      Object.keys(bundle).forEach((file) => {
        if (file.endsWith('.js')) delete bundle[file];
      });
    },
  };
}
