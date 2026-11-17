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
          '@wxt-dev/storage#build',
        ],
        cache: {
          input: [{ auto: true }, '!.wxt/**'],
        },
        command: 'vp exec wxt prepare',
      },
      build: {
        cache: {
          input: [{ auto: true }, '!.wxt/**', '!.output/**'],
        },
        command: 'vp exec wxt build',
      },
      'build:chrome-mv3': {
        cache: {
          input: [{ auto: true }, '!.wxt/**', '!.output/**'],
        },
        command: 'vp exec wxt build',
      },
      'build:chrome-mv2': {
        cache: {
          input: [{ auto: true }, '!.wxt/**', '!.output/**'],
        },
        command: 'vp exec wxt build --mv2',
      },
      'build:firefox-mv3': {
        cache: {
          input: [{ auto: true }, '!.wxt/**', '!.output/**'],
        },
        command: 'vp exec wxt build -b firefox --mv3',
      },
      'build:firefox-mv2': {
        cache: {
          input: [{ auto: true }, '!.wxt/**', '!.output/**'],
        },
        command: 'vp exec wxt build -b firefox',
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
