import { defineConfig, UserConfig } from 'tsdown';
import pkgJson from './package.json' with { type: 'json' };
import {
  virtualEntrypointModuleNames,
  virtualModuleNames,
} from './src/core/utils/virtual-modules';

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
    external: ['wxt/browser', 'virtual:app-config'],
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
      external: [
        ...virtualEntrypointModuleNames.map((name) => `virtual:user-${name}`),
        'virtual:wxt-plugins',
        'virtual:app-config',
        ...Object.keys(pkgJson.exports).map((path) => 'wxt' + path.slice(1)), // ./utils/storage => wxt/utils/storage
      ],
    }),
  ),
]);

async function replaceVars(
  file: string,
  vars: Record<string, string>,
): Promise<void> {
  let text = await Bun.file(file).text();
  Object.entries(vars).forEach(([name, value]) => {
    text = text.replaceAll(`{{${name}}}`, value);
  });
  await Bun.write(file, text);
}
