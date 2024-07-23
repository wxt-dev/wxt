import { defineBuildConfig } from 'unbuild';
import { virtualEntrypointModuleNames } from '~/core/utils/virtual-modules';
import { resolve } from 'node:path';

export default defineBuildConfig({
  clean: true,
  entries: [
    {
      builder: 'mkdist',
      input: 'src',
    },
  ],
  alias: {
    '~': resolve('src'),
  },
  externals: [
    ...virtualEntrypointModuleNames.map((name) => `virtual:user-${name}`),
    'virtual:wxt-plugins',
    'virtual:app-config',
  ],
  sourcemap: false,
  declaration: true,
});
