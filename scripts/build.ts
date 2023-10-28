import tsup, { Options } from 'tsup';
import glob from 'fast-glob';
import { printFileList } from '~/core/utils/log';
import { formatDuration } from '~/core/utils/time';
import ora from 'ora';
import fs from 'fs-extra';
import { consola } from 'consola';

const spinnerText = 'Building WXT';
const spinner = ora(spinnerText).start();

const startTime = Date.now();
const outDir = 'dist';
const virtualEntrypoints = ['background', 'content-script', 'unlisted-script'];

await fs.rm(outDir, { recursive: true, force: true });

const baseConfig: Options = {
  format: ['cjs', 'esm'],
  sourcemap: true,
  dts: true,
  silent: true,
  external: ['vite'],
};

function spinnerPromiseAll<T>(promises: Promise<T>[]): Promise<T[]> {
  let completed = 0;
  const updateSpinner = () => {
    spinner.text = `${spinnerText} [${completed}/${promises.length}]`;
  };
  updateSpinner();
  return Promise.all(
    promises.map(async (promise) => {
      const res = await promise;
      completed++;
      updateSpinner();
      return res;
    }),
  );
}

await spinnerPromiseAll([
  tsup.build({
    ...baseConfig,
    entry: { index: 'src/index.ts' },
  }),
  tsup.build({
    ...baseConfig,
    entry: { cli: 'src/cli.ts' },
    format: ['cjs'],
    sourcemap: 'inline',
  }),
  tsup.build({
    ...baseConfig,
    entry: { client: 'src/client/index.ts' },
    sourcemap: 'inline',
  }),
  tsup.build({
    ...baseConfig,
    entry: { browser: 'src/browser.ts' },
    format: ['esm'],
  }),
  tsup.build({
    ...baseConfig,
    entry: { sandbox: 'src/sandbox/index.ts' },
    format: ['esm'],
  }),
  tsup.build({
    ...baseConfig,
    entry: { testing: 'src/testing/index.ts' },
  }),
  ...virtualEntrypoints.map((entryName) =>
    tsup.build({
      ...baseConfig,
      entry: {
        [`virtual/${entryName}-entrypoint`]: `src/virtual/${entryName}-entrypoint.ts`,
      },
      format: ['esm'],
      external: [`virtual:user-${entryName}`, 'vite'],
    }),
  ),
  tsup.build({
    ...baseConfig,
    entry: {
      'virtual/reload-html': `src/virtual/reload-html.ts`,
    },
    format: ['esm'],
  }),
  tsup.build({
    ...baseConfig,
    entry: {
      'virtual/mock-browser': `src/virtual/mock-browser.ts`,
    },
  }),
]).catch((err) => {
  spinner.fail();
  console.error(err);
  process.exit(1);
});

spinner.clear().stop();

const duration = Date.now() - startTime;
const outFiles = await glob(`${outDir}/**`, { absolute: true });
await printFileList(
  consola.success,
  `Built WXT in ${formatDuration(duration)}`,
  outDir,
  outFiles,
);
