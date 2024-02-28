import { BuildOutput, BuildStepOutput, EntrypointGroup } from '~/types';
import { getPublicFiles } from '~/core/utils/fs';
import fs from 'fs-extra';
import { dirname, resolve } from 'path';
import type { Ora } from 'ora';
import pc from 'picocolors';
import { wxt } from '../../wxt';

export async function buildEntrypoints(
  groups: EntrypointGroup[],
  spinner: Ora,
): Promise<Omit<BuildOutput, 'manifest'>> {
  const steps: BuildStepOutput[] = [];
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const groupNames = [group].flat().map((e) => e.name);
    const groupNameColored = groupNames.join(pc.dim(', '));
    spinner.text =
      pc.dim(`[${i + 1}/${groups.length}]`) + ` ${groupNameColored}`;
    try {
      steps.push(await wxt.config.builder.build(group));
    } catch (err) {
      wxt.logger.error(err);
      throw Error(`Failed to build ${groupNames.join(', ')}`, { cause: err });
    }
  }
  const publicAssets = await copyPublicDirectory();

  return { publicAssets, steps };
}

async function copyPublicDirectory(): Promise<BuildOutput['publicAssets']> {
  const files = await getPublicFiles();
  if (files.length === 0) return [];

  const publicAssets: BuildOutput['publicAssets'] = [];
  for (const file of files) {
    const srcPath = resolve(wxt.config.publicDir, file);
    const outPath = resolve(wxt.config.outDir, file);

    await fs.ensureDir(dirname(outPath));
    await fs.copyFile(srcPath, outPath);
    publicAssets.push({
      type: 'asset',
      fileName: file,
    });
  }

  return publicAssets;
}
