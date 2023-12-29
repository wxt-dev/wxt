import tsup from 'tsup';
import glob from 'fast-glob';
import { printFileList } from '~/core/utils/log';
import { formatDuration } from '~/core/utils/time';
import ora from 'ora';
import fs from 'fs-extra';
import { consola } from 'consola';
import pMap from 'p-map';
import os from 'node:os';
import path from 'node:path';

const spinnerText = 'Building WXT';
const spinner = ora(spinnerText).start();

const startTime = Date.now();
const outDir = 'dist';
await fs.rm(path.join(outDir, '*'), { recursive: true, force: true });

const preset = {
  dts: true,
  silent: true,
  sourcemap: false,
  external: [
    'virtual:user-unlisted-script',
    'virtual:user-content-script-isolated-world',
    'virtual:user-content-script-main-world',
    'virtual:user-background',
  ],
} satisfies tsup.Options;

function spinnerPMap(configs: tsup.Options[]) {
  let progress = 1;
  const updateSpinner = () => {
    spinner.text = `${spinnerText} [${progress}/${configs.length}]`;
  };
  updateSpinner();

  return pMap(
    config,
    async (config) => {
      const res = await tsup.build(config);
      progress++;
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
  // CJS/ESM
  {
    ...preset,
    entry: {
      index: 'src/index.ts',
      testing: 'src/testing/index.ts',
      storage: 'src/storage.ts',
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
    },
    format: ['esm'],
  },
  {
    ...preset,
    entry: {
      'virtual/background-entrypoint': 'src/virtual/background-entrypoint.ts',
      'virtual/content-script-isolated-world-entrypoint':
        'src/virtual/content-script-isolated-world-entrypoint.ts',
      'virtual/content-script-main-world-entrypoint':
        'src/virtual/content-script-main-world-entrypoint.ts',
      'virtual/mock-browser': 'src/virtual/mock-browser.ts',
      'virtual/reload-html': 'src/virtual/reload-html.ts',
      'virtual/unlisted-script-entrypoint':
        'src/virtual/unlisted-script-entrypoint.ts',
    },
    format: ['esm'],
    splitting: false,
    dts: false,
    external: [...preset.external, 'wxt'],
  },
  // CJS-only
  {
    ...preset,
    entry: {
      cli: 'src/cli.ts',
    },
    format: ['esm'],
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
