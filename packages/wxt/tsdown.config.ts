import { defineConfig, UserConfig, Rolldown } from 'tsdown';
import pkgJson from './package.json' with { type: 'json' };
import { readFile, writeFile } from 'node:fs/promises';
import {
  virtualEntrypointModuleNames,
  virtualModuleNames,
} from './src/core/utils/virtual-modules';
import consola from 'consola';
import { styleText } from 'node:util';
import { resolve } from 'node:path';

// Before doing the actual build, "inline" some dependencies by bundling them
// individually to ESM and then, when building WXT, resolve them from the
// bundled local versions instead of listing them as a package dependency.
//
// Normally, this is exactly what `deps.alwaysBundle` does, but that option
// doesn't work in combination with "unbundle" mode - which WXT uses so it's
// `dist/` dir mirrors the `src/` dir, making it easy to explore and patch.

const inlineDeps = [
  'is-wsl',
  'get-port-please',
  'normalize-path',
  'ohash',
  'scule',
];

console.log();
consola.info('Transforming inline dependencies...');
const res = await Rolldown.build(
  inlineDeps.map(
    (id): Rolldown.BuildOptions => ({
      input: id,
      output: {
        dir: 'inline',
        entryFileNames: `${id}/index.mjs`,
        format: 'esm',
        minify: true,
      },
      platform: 'node',
    }),
  ),
);
for (const output of res) {
  consola.info(
    `${styleText('dim', 'inline/')}\`${output.output[0].fileName}\``,
  );
}
consola.success('Done!');
console.log();

const resolveInlinePlugin: Rolldown.Plugin = {
  name: 'resolve-inline',
  resolveId: {
    filter: { id: new RegExp(`(${inlineDeps.join('|')})`) },
    handler: (id) => resolve(`inline/${id}/index.mjs`),
  },
};

export default defineConfig([
  // Non-virtual modules can be transpiled in-place to make debugging in node_modules easier
  {
    entry: [
      // Exports
      ...Object.values(pkgJson.exports)
        .filter((ex: any) => ex.default)
        .map((ex: any) =>
          ex.default.replace('./dist', 'src').replace('.mjs', '.ts'),
        ),

      // CLI
      'src/cli/index.ts',
    ],
    unbundle: true,
    deps: {
      neverBundle: ['wxt/browser', 'virtual:app-config'],
      alwaysBundle: inlineDeps,
    },
    plugins: [resolveInlinePlugin],
    copy: [
      // If tsdown bundles this file, it removes the triple-slash reference, so
      // we need to copy it into the out dir manually instead of building it.
      'src/vite-builder-env.d.ts',
    ],
    onSuccess: async () => {
      // Don't rely on importing the package.json file at runtime, hardcode the
      // version to avoid issues with different runtimes handling JSON imports
      // differently.
      await replaceVars('dist/version.mjs', { version: pkgJson.version });
    },
  },

  // Virtual modules must be bundled individually
  ...virtualModuleNames.map(
    (moduleName): UserConfig => ({
      entry: `src/virtual/${moduleName}.ts`,
      outDir: 'dist/virtual',
      dts: false,
      deps: {
        neverBundle: [
          ...virtualEntrypointModuleNames.map((name) => `virtual:user-${name}`),
          'virtual:wxt-plugins',
          'virtual:app-config',
          ...Object.keys(pkgJson.exports).map((path) => 'wxt' + path.slice(1)), // ./utils/storage => wxt/utils/storage
        ],
      },
    }),
  ),
]);

async function replaceVars(
  file: string,
  vars: Record<string, string>,
): Promise<void> {
  let text = await readFile(file, 'utf8');
  Object.entries(vars).forEach(([name, value]) => {
    text = text.replaceAll(`{{${name}}}`, value);
  });
  await writeFile(file, text, 'utf8');
}
