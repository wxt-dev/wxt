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
import type { VirtualEntrypointType, VirtualModuleName } from '~/types';

const spinnerText = 'Building WXT';
const spinner = ora(spinnerText).start();

const startTime = Date.now();
const outDir = 'dist';
await fs.rm(path.join(outDir, '*'), { recursive: true, force: true });

const virtualModuleEntries: Record<`virtual/${VirtualModuleName}`, string> = {
  'virtual/background-entrypoint': 'src/virtual/background-entrypoint.ts',
  'virtual/content-script-isolated-world-entrypoint':
    'src/virtual/content-script-isolated-world-entrypoint.ts',
  'virtual/content-script-main-world-entrypoint':
    'src/virtual/content-script-main-world-entrypoint.ts',
  'virtual/mock-browser': 'src/virtual/mock-browser.ts',
  'virtual/reload-html': 'src/virtual/reload-html.ts',
  'virtual/unlisted-script-entrypoint':
    'src/virtual/unlisted-script-entrypoint.ts',
};

const externalModules: Record<
  `virtual:user-${VirtualEntrypointType}-entrypoint`,
  undefined
> = {
  'virtual:user-background-entrypoint': undefined,
  'virtual:user-content-script-isolated-world-entrypoint': undefined,
  'virtual:user-content-script-main-world-entrypoint': undefined,
  'virtual:user-unlisted-script-entrypoint': undefined,
};

const preset = {
  dts: true,
  silent: true,
  sourcemap: false,
  external: Object.keys(externalModules),
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
    entry: virtualModuleEntries,
    format: ['esm'],
    splitting: false,
    dts: false,
    external: [...preset.external, 'wxt'],
  },
  // CJS-only
  {
    ...preset,
    entry: {
      cli: 'src/cli/index.ts',
    },
    format: ['esm'],
    banner: {
      // Fixes dynamic require of nodejs modules. See https://github.com/wxt-dev/wxt/issues/355
      // https://github.com/evanw/esbuild/issues/1921#issuecomment-1152991694
      js: "import { createRequire } from 'module';const require = createRequire(import.meta.url);",
    },
  },
];

await spinnerPMap(config).catch((err) => {
  spinner.fail();
  console.error(err);
  process.exit(1);
});

// Copy "public" files that need shipped inside WXT
await fs.copyFile('src/vite-builder-env.d.ts', 'dist/vite-builder-env.d.ts');

spinner.clear().stop();

const duration = Date.now() - startTime;
const outFiles = await glob(`${outDir}/**`, { absolute: true });
await printFileList(
  consola.success,
  `Built WXT in ${formatDuration(duration)}`,
  outDir,
  outFiles,
);
