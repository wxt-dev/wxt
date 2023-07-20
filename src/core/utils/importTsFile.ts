import createJITI from 'jiti';
import { InternalConfig } from '../types';
import { createUnimport } from 'unimport';
import fs from 'fs-extra';
import { resolve } from 'path';
import transform from 'jiti/dist/babel';
import { getUnimportOptions } from './auto-imports';
import { removeImportStatements } from './strings';

/**
 * Get the value from the default export of a `path`.
 *
 * It works by:
 *
 * 1. Reading the file text
 * 2. Stripping all imports from it via regex
 * 3. Auto-import only the client helper functions
 *
 * This prevents resolving imports of imports, speeding things up and preventing "xxx is not
 * defined" errors.
 *
 * Downside is that code cannot be executed outside of the main fucntion for the entrypoint,
 * otherwise you will see "xxx is not defined" errors for any imports used outside of main function.
 */
export async function importTsFile<T>(
  path: string,
  config: InternalConfig,
): Promise<T> {
  config.logger.debug('Loading file metadata:', path);

  const unimport = createUnimport({
    ...getUnimportOptions(config),
    // Only allow specific imports, not all from the project
    imports: [{ name: '*', as: 'browser', from: 'webextension-polyfill' }],
    dirs: [],
  });
  await unimport.init();

  const text = await fs.readFile(path, 'utf-8');
  const textNoImports = removeImportStatements(text);
  const { code } = await unimport.injectImports(textNoImports);
  config.logger.debug(
    ['Text:', text, 'No imports:', textNoImports, 'Code:', code].join('\n'),
  );

  const jiti = createJITI(__filename, {
    cache: false,
    esmResolve: true,
    interopDefault: true,
    alias: {
      'webextension-polyfill': resolve(
        config.root,
        'node_modules/wxt/dist/virtual-modules/fake-browser.js',
      ),
    },
    transform(opts) {
      if (opts.filename === path) return transform({ ...opts, source: code });
      else return transform(opts);
    },
  });

  try {
    return await jiti(path);
  } catch (err) {
    config.logger.error(err);
    throw err;
  }
}
