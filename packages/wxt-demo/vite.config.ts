import { defineConfig } from 'vite-plus';

export default defineConfig({
  run: {
    tasks: {
      postinstall: {
        dependsOn: [
          'wxt#build',
          '@wxt-dev/auto-icons#build',
          '@wxt-dev/i18n#build',
          '@wxt-dev/unocss#build',
        ],
        input: [{ auto: true }, '!.wxt/**'],
        command: 'vpx wxt prepare',
      },
      build: {
        input: [{ auto: true }, '!.wxt/**', '!.output/**'],
        command: 'vpx wxt build',
      },
      'build:chrome-mv3': {
        input: [{ auto: true }, '!.wxt/**', '!.output/**'],
        command: 'vpx wxt build',
      },
      'build:chrome-mv2': {
        input: [{ auto: true }, '!.wxt/**', '!.output/**'],
        command: 'vpx wxt build --mv2',
      },
      'build:firefox-mv3': {
        input: [{ auto: true }, '!.wxt/**', '!.output/**'],
        command: 'vpx wxt build -b firefox --mv3',
      },
      'build:firefox-mv2': {
        input: [{ auto: true }, '!.wxt/**', '!.output/**'],
        command: 'vpx wxt build -b firefox',
      },
      'build:all': {
        dependsOn: [
          'build:chrome-mv3',
          'build:chrome-mv2',
          'build:firefox-mv3',
          'build:firefox-mv2',
        ],
        command: 'echo "All builds complete!"',
      },
    },
  },
});
