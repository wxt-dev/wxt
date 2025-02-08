import { defineBuildConfig } from 'unbuild';
import { version } from './package.json';
import { readFile, writeFile } from 'fs/promises';
import {
  virtualEntrypointModuleNames,
  virtualModuleNames,
} from './src/core/utils/virtual-modules';

export default defineBuildConfig([
  // Non-virtual modules can be transpiled with mkdist
  {
    entries: [
      {
        builder: 'mkdist',
        input: 'src',
        pattern: ['**/*', '!**/__tests__', '!**/*.md', '!virtual', '!@types'],
        declaration: true,
      },
    ],
    hooks: {
      async 'build:done'() {
        // Replace any template variables in output files
        await replaceVars('dist/version.mjs', { version });
      },
    },
  },

  // Virtual modules must be bundled individually
  ...virtualModuleNames.map((moduleName) => ({
    entries: [`src/virtual/${moduleName}.ts`],
    externals: [
      ...virtualEntrypointModuleNames.map((name) => `virtual:user-${name}`),
      'virtual:wxt-plugins',
      'virtual:app-config',
      'wxt/browser',
      'wxt/sandbox',
      'wxt/client',
      'wxt/testing',
    ],
  })),
]);

async function replaceVars(file: string, vars: Record<string, string>) {
  let text = await readFile(file, 'utf8');
  Object.entries(vars).forEach(([name, value]) => {
    text = text.replaceAll(`{{${name}}}`, value);
  });
  await writeFile(file, text, 'utf8');
}
