import { consola } from 'consola';
import createJITI from 'jiti';
import transform from 'jiti/dist/babel';
import { createUnimport } from 'unimport';
import fs from 'fs-extra';
import { getUnimportOptions } from './auto-imports';
import { InternalConfig } from '../types';
import { loadConfig } from 'c12';
import { resolve } from 'path';

export async function importTsFile<T>(
  path: string,
  config: InternalConfig,
): Promise<T> {
  const options = getUnimportOptions(config);
  const unimport = createUnimport(options);
  await unimport.scanImportsFromDir(undefined, { cwd: config.srcDir });

  const text = await fs.readFile(path, 'utf-8');
  const res = await unimport.injectImports(text, path);
  const transformedText = res.code;

  // const jiti = createJITI(__filename, {
  //   cache: false,
  //   esmResolve: true,
  //   interopDefault: true,
  //   alias: {
  //     'webextension-polyfill': '@webext-core/fake-browser',
  //   },

  //   transform(opts) {
  //     if (opts.filename === path) opts.source = transformedText;

  //     // Remove CSS imports from the source code - Jiti can't handle them.
  //     opts.source = opts.source.replace(/^import ['"].*\.css['"];?$/gm, '');

  //     // Call the default babel transformer with our modified source code
  //     return transform(opts);
  //   },
  // });
  // try {
  //   return await jiti(path);
  // } catch (err) {
  //   consola.error(`Failed to import file: ${path}`);
  //   throw err;
  // }

  try {
    const loaded = await loadConfig<T>({
      configFile: path,
      rcFile: false,
      jitiOptions: {
        cache: false,
        // esmResolve: true,
        // interopDefault: true,
        alias: {
          'webextension-polyfill': resolve(
            config.root,
            'node_modules/wxt/dist/virtual-modules/fake-browser.js',
          ),
        },
        transform(opts) {
          if (opts.filename === path) opts.source = transformedText;

          // Remove CSS imports from the source code - Jiti can't handle them.
          opts.source = opts.source.replace(
            /^import.*['"].*\.css['"];?$/gm,
            '',
          );

          // Call the default babel transformer with our modified source code
          return transform(opts);
        },
      },
    });
    return loaded.config;
  } catch (err) {
    consola.error(`Failed to import file: ${path}`);
    throw err;
  }
}
