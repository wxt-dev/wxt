import createJITI, { TransformOptions as JitiTransformOptions } from 'jiti';
import { InternalConfig } from '../types';
import { createUnimport } from 'unimport';
import fs from 'fs-extra';
import { resolve } from 'path';
import { getUnimportOptions } from './auto-imports';
import { removeProjectImportStatements } from './strings';
import { normalizePath } from './paths';
import { TransformOptions, transformSync } from 'esbuild';

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
export async function importEntrypointFile<T>(
  path: string,
  config: InternalConfig,
): Promise<T> {
  config.logger.debug('Loading file metadata:', path);
  // JITI & Babel uses normalized paths.
  const normalPath = normalizePath(path);

  const unimport = createUnimport({
    ...getUnimportOptions(config),
    // Only allow specific imports, not all from the project
    dirs: [],
  });
  await unimport.init();

  const text = await fs.readFile(path, 'utf-8');
  const textNoImports = removeProjectImportStatements(text);
  const { code } = await unimport.injectImports(textNoImports);
  config.logger.debug(
    ['Text:', text, 'No imports:', textNoImports, 'Code:', code].join('\n'),
  );

  const jiti = createJITI(__filename, {
    cache: false,
    debug: config.debug,
    esmResolve: true,
    interopDefault: true,
    alias: {
      'webextension-polyfill': resolve(
        config.root,
        'node_modules/wxt/dist/virtual-modules/fake-browser.js',
      ),
    },
    extensions: ['.ts', '.tsx', '.cjs', '.js', '.mjs'],
    transform(opts) {
      const isEntrypoint = opts.filename === normalPath;
      return transformSync(
        // Use modified source code for entrypoint
        isEntrypoint ? code : opts.source,
        getEsbuildOptions(opts),
      );
    },
  });

  try {
    return await jiti(path);
  } catch (err) {
    config.logger.error(err);
    throw err;
  }
}

function getEsbuildOptions(opts: JitiTransformOptions): TransformOptions {
  const isJsx = opts.filename?.endsWith('x');
  return {
    format: 'cjs',
    loader: isJsx ? 'tsx' : 'ts',
    jsx: isJsx ? 'automatic' : undefined,
  };
}
