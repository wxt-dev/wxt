const entry = {
  index: './modules/solid.ts',
};

import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: [
    {
      entry,
    },
    {
      entry,
      format: 'cjs',
    },
  ],
  run: {
    tasks: {
      postinstall: {
        dependsOn: ['wxt#build', '@wxt-dev/storage#build'],
        input: [{ auto: true }, '!.wxt/**'],
        command: 'vp exec wxt prepare',
      },
    },
  },
});
