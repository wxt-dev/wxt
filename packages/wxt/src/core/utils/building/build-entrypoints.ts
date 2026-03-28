import {
  BuildOutput,
  BuildStepOutput,
  EntrypointGroup,
  ResolvedPublicFile,
} from '../../../types';
import { getPublicFiles } from '../fs';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'path';
import type { Spinner } from 'nanospinner';
import pc from 'picocolors';
import { wxt } from '../../wxt';
import { toArray } from '../arrays';

export async function buildEntrypoints(
  groups: EntrypointGroup[],
  spinner: Spinner,
): Promise<Omit<BuildOutput, 'manifest'>> {
  const steps: BuildStepOutput[] = [];
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const groupNames = toArray(group).map((e) => e.name);
    const groupNameColored = groupNames.join(pc.dim(', '));
    spinner.update({
      text: pc.dim(`[${i + 1}/${groups.length}]`) + ` ${groupNameColored}`,
    });
    try {
      steps.push(await wxt.builder.build(group));
    } catch (err) {
      spinner.stop();
      spinner.clear();
      wxt.logger.error(err);
      throw Error(`Failed to build ${groupNames.join(', ')}`, { cause: err });
    }
  }
  const publicAssets = await copyPublicDirectory();

  return { publicAssets, steps };
}

async function copyPublicDirectory(): Promise<BuildOutput['publicAssets']> {
  const files = (await getPublicFiles()).map<ResolvedPublicFile>((file) => ({
    absoluteSrc: resolve(wxt.config.publicDir, file),
    relativeDest: file,
  }));
  await wxt.hooks.callHook('build:publicAssets', wxt, files);
  if (files.length === 0) return [];

  const publicAssets: BuildOutput['publicAssets'] = [];
  for (const file of files) {
    const absoluteDest = resolve(wxt.config.outDir, file.relativeDest);

    await mkdir(dirname(absoluteDest), { recursive: true });
    if ('absoluteSrc' in file) {
      await copyFile(file.absoluteSrc, absoluteDest);
    } else {
      await writeFile(absoluteDest, file.contents, 'utf8');
    }
    publicAssets.push({
      type: 'asset',
      fileName: file.relativeDest,
    });
  }

  return publicAssets;
}
