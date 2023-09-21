import * as vite from 'vite';
import {
  BuildOutput,
  BuildStepOutput,
  Entrypoint,
  EntrypointGroup,
  InternalConfig,
} from '../types';
import * as wxtPlugins from '../vite-plugins';
import { removeEmptyDirs } from '../utils/removeEmptyDirs';
import { getEntrypointBundlePath } from '../utils/entrypoints';
import fs from 'fs-extra';
import { dirname, resolve } from 'path';
import { getPublicFiles } from '../utils/public';
import { getEntrypointGlobals } from '../utils/globals';

export async function buildEntrypoints(
  groups: EntrypointGroup[],
  config: InternalConfig,
): Promise<Omit<BuildOutput, 'manifest'>> {
  const steps: BuildStepOutput[] = [];
  for (const group of groups) {
    const step = Array.isArray(group)
      ? await buildMultipleEntrypoints(group, config)
      : await buildSingleEntrypoint(group, config);
    steps.push(step);
  }
  const publicAssets = await copyPublicDirectory(config);

  // Remove any empty directories from moving outputs around
  await removeEmptyDirs(config.outDir);

  return { publicAssets, steps };
}

/**
 * Use Vite's lib mode + IIFE format to bundle the entrypoint to a single file.
 */
async function buildSingleEntrypoint(
  entrypoint: Entrypoint,
  config: InternalConfig,
): Promise<BuildStepOutput> {
  // Should this entrypoint be wrapped by the vite-plugins/virtualEntrypoint plugin?
  const isVirtual = ['background', 'content-script'].includes(entrypoint.type);
  const entry = isVirtual
    ? `virtual:wxt-${entrypoint.type}?${entrypoint.inputPath}`
    : entrypoint.inputPath;

  const plugins: NonNullable<vite.UserConfig['plugins']> = [];
  if (
    entrypoint.type === 'content-script-style' ||
    entrypoint.type === 'unlisted-style'
  ) {
    plugins.push(wxtPlugins.cssEntrypoints(entrypoint, config));
  }

  const libMode: vite.UserConfig = {
    plugins,
    build: {
      lib: {
        entry,
        formats: ['iife'],
        name: '_',
        fileName: entrypoint.name,
      },
      rollupOptions: {
        output: {
          // There's only a single output for this build, so we use the desired bundle path for the
          // entry output (like "content-scripts/overlay.js")
          entryFileNames: getEntrypointBundlePath(
            entrypoint,
            config.outDir,
            '.js',
          ),
          // Output content script CSS to assets/ with a hash to prevent conflicts. Defaults to
          // "[name].[ext]" in lib mode, which usually results in "style.css". That means multiple
          // content scripts with styles would overwrite each other if it weren't changed below.
          assetFileNames: `assets/${entrypoint.name}.[ext]`,
        },
      },
    },
    define: {
      // See https://github.com/aklinker1/vite-plugin-web-extension/issues/96
      'process.env.NODE_ENV': JSON.stringify(config.mode),
    },
  };
  for (const global of getEntrypointGlobals(config, entrypoint.name)) {
    libMode.define![global.name] = JSON.stringify(global.value);
  }
  const entryConfig = vite.mergeConfig(
    libMode,
    config.vite,
  ) as vite.InlineConfig;

  const result = await vite.build(entryConfig);
  return {
    entrypoints: entrypoint,
    chunks: getBuildOutputChunks(result),
  };
}

/**
 * Use Vite's multipage build to bundle all the entrypoints in a single step.
 */
async function buildMultipleEntrypoints(
  entrypoints: Entrypoint[],
  config: InternalConfig,
): Promise<BuildStepOutput> {
  const multiPage: vite.UserConfig = {
    plugins: [wxtPlugins.multipageMove(entrypoints, config)],
    build: {
      rollupOptions: {
        input: entrypoints.reduce<Record<string, string>>((input, entry) => {
          input[entry.name] = entry.inputPath;
          return input;
        }, {}),
        output: {
          // Include a hash to prevent conflicts
          chunkFileNames: 'chunks/[name]-[hash].js',
          // Include a hash to prevent conflicts
          entryFileNames: 'chunks/[name]-[hash].js',
          // We can't control the "name", so we need a hash to prevent conflicts
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
    define: {},
  };
  for (const global of getEntrypointGlobals(config, 'html')) {
    multiPage.define![global.name] = JSON.stringify(global.value);
  }

  const entryConfig = vite.mergeConfig(
    multiPage,
    config.vite,
  ) as vite.UserConfig;

  const result = await vite.build(entryConfig);
  return {
    entrypoints,
    chunks: getBuildOutputChunks(result),
  };
}

function getBuildOutputChunks(
  result: Awaited<ReturnType<typeof vite.build>>,
): BuildStepOutput['chunks'] {
  if ('on' in result) throw Error('wxt does not support vite watch mode.');
  if (Array.isArray(result)) return result.flatMap(({ output }) => output);
  return result.output;
}

async function copyPublicDirectory(
  config: InternalConfig,
): Promise<BuildOutput['publicAssets']> {
  const files = await getPublicFiles(config);
  if (files.length === 0) return [];

  const publicAssets: BuildOutput['publicAssets'] = [];
  for (const file of files) {
    const srcPath = resolve(config.publicDir, file);
    const outPath = resolve(config.outDir, file);

    await fs.ensureDir(dirname(outPath));
    await fs.copyFile(srcPath, outPath);
    publicAssets.push({
      type: 'asset',
      fileName: file,
      name: file,
      needsCodeReference: false,
      source: await fs.readFile(srcPath),
    });
  }

  return publicAssets;
}
