import { consola } from 'consola';
import createJITI from 'jiti';
import transform from 'jiti/dist/babel';
import { resolve } from 'path';
import { createUnimport } from 'unimport';
import fs from 'fs-extra';

export async function importTsFile<T>(root: string, path: string): Promise<T> {
  const unimport = createUnimport({});
  await unimport.scanImportsFromFile(
    resolve(root, 'node_modules/wxt/dist/client.js'),
  );
  const text = await fs.readFile(path, 'utf-8');
  const res = await unimport.injectImports(text, path);
  const transformedText = res.code;

  const jiti = createJITI(__filename, {
    cache: false,
    esmResolve: true,
    interopDefault: true,
    alias: {
      'webextension-polyfill': '@webext-core/fake-browser',
    },

    transform(opts) {
      if (opts.filename === path) opts.source = transformedText;

      // Remove CSS imports from the source code - Jiti can't handle them.
      opts.source = opts.source.replace(/^import ['"].*\.css['"];?$/gm, '');

      // Call the default babel transformer with our modified source code
      return transform(opts);
    },
  });
  try {
    return await jiti(path);
  } catch (err) {
    consola.error(`Failed to import file: ${path}`);
    throw err;
  }
}
