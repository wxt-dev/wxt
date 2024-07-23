import { defineBuildConfig } from 'unbuild';
import { version } from './package.json';
import { readFile, writeFile } from 'fs/promises';
import { virtualEntrypointModuleNames } from './src/core/utils/virtual-modules';

const basePattern = ['**/*', '!**/__tests__', '!**/*.md'];

export default defineBuildConfig([
  {
    entries: [
      {
        builder: 'mkdist',
        input: 'src',
        pattern: [...basePattern, '!virtual'],
        declaration: true,
      },
    ],
    hooks: {
      async 'build:done'() {
        await replaceVars('dist/version.mjs', { version });
      },
    },
  },
  {
    entries: virtualEntrypointModuleNames.map(
      (moduleName) => `src/virtual/${moduleName}.ts`,
    ),
    externals: [
      ...virtualEntrypointModuleNames.map((name) => `virtual:user-${name}`),
      'virtual:wxt-plugins',
      'virtual:app-config',
      'wxt/browser',
      'wxt/sandbox',
      'wxt/client',
    ],
  },
]);

async function replaceVars(file: string, vars: Record<string, string>) {
  let text = await readFile(file, 'utf8');
  Object.entries(vars).forEach(([name, value]) => {
    text = text.replaceAll(`{{${name}}}`, value);
  });
  await writeFile(file, text, 'utf8');
}
