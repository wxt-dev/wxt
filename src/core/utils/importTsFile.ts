import createJITI from 'jiti';
import { InternalConfig } from '../types';
import { createUnimport } from 'unimport';
import fs from 'fs-extra';
import { resolve } from 'path';
import transform from 'jiti/dist/babel';
import { getUnimportOptions } from './auto-imports';

export async function importTsFile<T>(
  path: string,
  config: InternalConfig,
): Promise<T> {
  config.logger.log('Loading file metadata:', path);

  const unimport = createUnimport({
    ...getUnimportOptions(config),
    // Only allow specific imports, not all from the project
    imports: [{ name: '*', as: 'browser', from: 'webextension-polyfill' }],
    dirs: [],
  });
  await unimport.init();

  const text = await fs.readFile(path, 'utf-8');
  const textNoImports = text.replace(/import.*[\n;]/gm, '');
  const { code } = await unimport.injectImports(textNoImports);
  config.logger.log(
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
