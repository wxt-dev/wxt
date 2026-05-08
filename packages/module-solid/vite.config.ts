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
        dependsOn: ['wxt#build'],
        input: [{ auto: true }, '!.wxt/**'],
        command: 'vpx wxt prepare',
      },
    },
  },
});
