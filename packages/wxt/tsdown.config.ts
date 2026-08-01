import { defineConfig, UserConfig } from 'tsdown';
import pkgJson from './package.json' with { type: 'json' };
import { readdir, readFile, writeFile } from 'node:fs/promises';
import {
  virtualEntrypointModuleNames,
  virtualModuleNames,
} from './src/core/utils/virtual-modules';
import { vendorBundledDependencies } from './build-plugins/vendor-bundled-dependencies';

// Force-bundled into dist/_vendor so consumers don't need these as dependencies.
// Kept in sync with `deps.alwaysBundle` + `vendorBundledDependencies({ packages })`.
const alwaysBundle = ['normalize-path'];

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
      alwaysBundle,
    },
    // Remap alwaysBundle packages to `_vendor/<pkg>` at resolve-time so
    // unbundle/preserveModules doesn't emit bun/pnpm `node_modules` nests.
    plugins: [
      vendorBundledDependencies({
        packages: alwaysBundle,
        cwd: import.meta.dirname,
      }),
    ],
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
      await assertNoNodeModulesPaths('dist');
    },
  },

  // Virtual modules must be bundled individually
  ...virtualModuleNames.map(
    (moduleName): UserConfig => ({
      entry: `src/virtual/${moduleName}.ts`,
      outDir: 'dist/virtual',
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

/**
 * Bundling a dependency under `unbundle` emits it at its build-time
 * `node_modules` path unless `vendorBundledDependencies` remaps it. Those paths
 * depend on the package manager used to build, so they break for consumers.
 */
async function assertNoNodeModulesPaths(dir: string): Promise<void> {
  const entries = await readdir(dir, { recursive: true });
  const leaked = entries.filter((entry) =>
    entry.replaceAll('\\', '/').includes('node_modules/'),
  );
  if (leaked.length > 0) {
    throw new Error(
      `Build emitted files under a node_modules path:\n${leaked.map((entry) => `  ${dir}/${entry}`).join('\n')}`,
    );
  }
}

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
