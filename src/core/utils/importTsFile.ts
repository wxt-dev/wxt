import { consola } from 'consola';
import createJITI from 'jiti';
import transform from 'jiti/dist/babel';
import { resolve } from 'path';
import { scanExports } from 'unimport';

export async function importTsFile<T>(root: string, path: string): Promise<T> {
  const clientImports = await scanExports(
    resolve(root, 'node_modules/wxt/dist/client.js'),
  );
  const jiti = createJITI(__filename, {
    cache: false,
    esmResolve: true,
    interopDefault: true,

    transform(opts) {
      // Remove CSS imports from the source code - Jiti can't handle them.
      opts.source = opts.source.replace(/^import ['"].*\.css['"];?$/gm, '');
      opts.source = opts.source.replace(
        /^import\s+.*\s+from ['"]webextension-polyfill['"];?$/gm,
        '',
      );

      // Append any wxt/client functions so babel doesn't complain about undefined variables
      if (opts.filename === path) {
        // TODO: Only append import if it isn't already imported
        const imports =
          clientImports
            .map((i) => `import { ${i.name} } from "${i.from}";`)
            .join('\n') + '\n';
        opts.source = imports + opts.source;
      }

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
