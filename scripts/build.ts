import tsup from 'tsup';
import glob from 'fast-glob';
import { printFileList } from '../src/core/log/printFileList';
import { formatDuration } from '../src/core/utils/formatDuration';
import ora from 'ora';
import fs from 'fs-extra';
import { consola } from 'consola';

const spinner = ora('Building WXT').start();

const startTime = Date.now();
const outDir = 'dist';
const virtualEntrypoints = ['background', 'content-script', 'unlisted-script'];

await fs.rm(outDir, { recursive: true, force: true });

await Promise.all([
  tsup.build({
    entry: {
      index: 'src/index.ts',
    },
    format: ['cjs', 'esm'],
    sourcemap: true,
    dts: true,
    silent: true,
    external: ['vite'],
  }),
  tsup.build({
    entry: { cli: 'src/cli/index.ts' },
    format: ['cjs'],
    sourcemap: 'inline',
    silent: true,
    external: ['vite'],
  }),
  tsup.build({
    entry: { client: 'src/client/index.ts' },
    format: ['esm'],
    sourcemap: 'inline',
    dts: true,
    silent: true,
    external: ['vite'],
  }),
  tsup.build({
    entry: { browser: 'src/client/browser.ts' },
    format: ['esm'],
    sourcemap: 'inline',
    dts: true,
    silent: true,
    external: ['vite'],
  }),
  tsup.build({
    entry: { sandbox: 'src/client/sandbox/index.ts' },
    format: ['esm'],
    sourcemap: 'inline',
    dts: true,
    silent: true,
  }),
  tsup.build({
    entry: { testing: 'src/testing/index.ts' },
    format: ['esm'],
    sourcemap: 'inline',
    dts: true,
    silent: true,
  }),
  ...virtualEntrypoints.map((entryName) =>
    tsup.build({
      entry: {
        [`virtual-modules/${entryName}-entrypoint`]: `src/client/virtual-modules/${entryName}-entrypoint.ts`,
      },
      format: ['esm'],
      sourcemap: true,
      silent: true,
      external: [`virtual:user-${entryName}`, 'vite'],
    }),
  ),
  tsup.build({
    entry: {
      'virtual-modules/reload-html': `src/client/virtual-modules/reload-html.ts`,
    },
    format: ['esm'],
    sourcemap: true,
    silent: true,
    external: ['vite'],
  }),
  tsup.build({
    entry: {
      'virtual-modules/fake-browser': `src/client/virtual-modules/fake-browser.ts`,
    },
    format: ['esm', 'cjs'],
    silent: true,
    external: ['vite'],
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
