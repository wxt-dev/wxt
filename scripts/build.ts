import tsup from 'tsup';
import glob from 'fast-glob';
import { printFileList } from '~/core/utils/log';
import { formatDuration } from '~/core/utils/time';
import ora from 'ora';
import fs from 'fs-extra';
import { consola } from 'consola';
import pMap from 'p-map';
import os from 'node:os';

const spinnerText = 'Building WXT';
const spinner = ora(spinnerText).start();

const startTime = Date.now();
const outDir = 'dist';
const virtualEntrypoints = ['background', 'content-script', 'unlisted-script'];

await fs.rm(outDir, { recursive: true, force: true });

const baseConfig: tsup.Options = {
  format: ['cjs', 'esm'],
  sourcemap: true,
  dts: true,
  silent: true,
  external: ['vite'],
};

function spinnerPMap(configs: tsup.Options[]) {
  let completed = 0;
  const updateSpinner = () => {
    spinner.text = `${spinnerText} [${completed}/${configs.length}]`;
  };
  updateSpinner();

  return pMap(
    config,
    async (config) => {
      const res = await tsup.build(config);
      completed++;
      updateSpinner();
      return res;
    },
    {
      stopOnError: true,
      concurrency: process.env.CI === 'true' ? os.cpus().length : Infinity,
    },
  );
}

const config: tsup.Options[] = [
  {
    ...baseConfig,
    entry: { index: 'src/index.ts' },
  },
  {
    ...baseConfig,
    entry: { cli: 'src/cli.ts' },
    format: ['cjs'],
    sourcemap: 'inline',
  },
  {
    ...baseConfig,
    entry: { client: 'src/client/index.ts' },
    sourcemap: 'inline',
  },
  {
    ...baseConfig,
    entry: { browser: 'src/browser.ts' },
    format: ['esm'],
  },
  {
    ...baseConfig,
    entry: { sandbox: 'src/sandbox/index.ts' },
    format: ['esm'],
  },
  {
    ...baseConfig,
    entry: { testing: 'src/testing/index.ts' },
  },
  ...virtualEntrypoints.map(
    (entryName): tsup.Options => ({
      ...baseConfig,
      entry: {
        [`virtual/${entryName}-entrypoint`]: `src/virtual/${entryName}-entrypoint.ts`,
      },
      format: ['esm'],
      external: [`virtual:user-${entryName}`, 'vite'],
    }),
  ),
  {
    ...baseConfig,
    entry: {
      'virtual/reload-html': `src/virtual/reload-html.ts`,
    },
    format: ['esm'],
  },
  {
    ...baseConfig,
    entry: {
      'virtual/mock-browser': `src/virtual/mock-browser.ts`,
    },
  },
];

await spinnerPMap(config).catch((err) => {
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
