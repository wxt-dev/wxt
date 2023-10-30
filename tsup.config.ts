import { Options, defineConfig } from 'tsup';
import { printFileList } from '~/core/utils/log';
import { formatDuration } from '~/core/utils/time';
import glob from 'fast-glob';
import consola from 'consola';

const startTime = Date.now();

const preset: Options = {
  format: ['cjs', 'esm'],
  sourcemap: true,
  dts: true,
  external: [
    'virtual:user-unlisted-script',
    'virtual:user-content-script',
    'virtual:user-background',
  ],
};

export default defineConfig([
  // CJS/ESM
  {
    ...preset,
    entry: {
      index: 'src/index.ts',
      testing: 'src/testing/index.ts',
    },
    format: ['cjs', 'esm'],
    clean: true,
  },
  // ESM-only
  {
    ...preset,
    entry: {
      browser: 'src/browser.ts',
      sandbox: 'src/sandbox/index.ts',
      client: 'src/client/index.ts',
      'virtual/background-entrypoint': 'src/virtual/background-entrypoint.ts',
      'virtual/content-script-entrypoint':
        'src/virtual/content-script-entrypoint.ts',
      'virtual/mock-browser': 'src/virtual/mock-browser.ts',
      'virtual/reload-html': 'src/virtual/reload-html.ts',
      'virtual/unlisted-script-entrypoint':
        'src/virtual/unlisted-script-entrypoint.ts',
    },
    format: ['esm'],
  },
  // CJS-only
  {
    ...preset,
    entry: {
      cli: 'src/cli.ts',
    },
    format: ['cjs'],
  },
]);
