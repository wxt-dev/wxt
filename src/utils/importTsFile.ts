import { consola } from 'consola';
import createJITI from 'jiti';
import transform from 'jiti/dist/babel';

export async function importTsFile<T>(path: string): Promise<T> {
  const jiti = createJITI(__filename, {
    alias: {
      'webextension-polyfill': 'exvite',
      '*.css': 'exvite',
    },
    cache: false,
    esmResolve: true,
    interopDefault: true,

    transform(opts) {
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
