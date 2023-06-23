import * as vite from 'vite';
import { BuildOutput, Entrypoint, InternalConfig } from '../types';
import { groupEntrypoints } from './groupEntrypoints';
import * as plugins from '../vite-plugins';
import { removeEmptyDirs } from './removeEmptyDirs';
import { getEntrypointBundlePath } from './entrypoints';

export async function buildEntrypoints(
  entrypoints: Entrypoint[],
  config: InternalConfig,
): Promise<BuildOutput> {
  const groups = groupEntrypoints(entrypoints);

  const outputs: BuildOutput[] = [];
  for (const group of groups) {
    const output = Array.isArray(group)
      ? await buildMultipleEntrypoints(group, config)
      : await buildSingleEntrypoint(group, config);
    outputs.push(output);
  }

  // Remove any empty directories from moving outputs around
  await removeEmptyDirs(config.outDir);

  return outputs.flat();
}

/**
 * Use Vite's lib mode + IIFE format to bundle the entrypoint to a single file.
 */
async function buildSingleEntrypoint(
  entrypoint: Entrypoint,
  config: InternalConfig,
): Promise<BuildOutput> {
  const libMode: vite.InlineConfig = {
    build: {
      lib: {
        entry: entrypoint.inputPath,
        formats: ['iife'],
        name: entrypoint.name,
        fileName: entrypoint.name,
      },
      rollupOptions: {
        output: {
          entryFileNames: getEntrypointBundlePath(
            entrypoint,
            config.outDir,
            '.js',
          ),
          // Output content script CSS to assets/ with a hash to prevent conflicts. Defaults to
          // "[name].[ext]" in lib mode, which usually results in "style.css". That means multiple
          // content scripts with styles would overwrite each other if it weren't changed below.
          assetFileNames: `assets/${entrypoint.name}-[hash].[ext]`,
        },
      },
    },
  };
  const entryConfig = vite.mergeConfig(
    libMode,
    config.vite,
  ) as vite.InlineConfig;

  const result = await vite.build(entryConfig);
  return getBuildOutput(result);
}

/**
 * Use Vite's multipage build to bundle all the entrypoints in a single step.
 */
async function buildMultipleEntrypoints(
  entrypoints: Entrypoint[],
  config: InternalConfig,
): Promise<BuildOutput> {
  const multiPage: vite.InlineConfig = {
    plugins: [plugins.multipageMove(entrypoints, config)],
    build: {
      rollupOptions: {
        input: entrypoints.reduce<Record<string, string>>((input, entry) => {
          input[entry.name] = entry.inputPath;
          return input;
        }, {}),
      },
    },
  };

  const entryConfig = vite.mergeConfig(
    multiPage,
    config.vite,
  ) as vite.InlineConfig;

  const result = await vite.build(entryConfig);
  return getBuildOutput(result);
}

function getBuildOutput(
  result: Awaited<ReturnType<typeof vite.build>>,
): BuildOutput {
  if ('on' in result) throw Error('exvite does not support vite watch mode.');
  if (Array.isArray(result)) return result.flatMap(({ output }) => output);
  return result.output;
}
