import {
  BuildOutput,
  BuildStepOutput,
  EntrypointGroup,
  InternalConfig,
} from '~/types';
import { removeEmptyDirs } from '~/core/utils/fs';
import { getPublicFiles } from '~/core/utils/fs';
import fs from 'fs-extra';
import { dirname, resolve } from 'path';
import type { Ora } from 'ora';
import pc from 'picocolors';

export async function buildEntrypoints(
  groups: EntrypointGroup[],
  config: InternalConfig,
  spinner: Ora,
): Promise<Omit<BuildOutput, 'manifest'>> {
  const steps: BuildStepOutput[] = [];
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const groupNames = [group]
      .flat()
      .map((e) => e.name)
      .join(pc.dim(', '));
    spinner.text = pc.dim(`[${i + 1}/${groups.length}]`) + ` ${groupNames}`;
    steps.push(await config.builder.build(group));
  }
  const publicAssets = await copyPublicDirectory(config);

  // Remove any empty directories from moving outputs around
  // TODO: Move into vite
  await removeEmptyDirs(config.outDir);

  return { publicAssets, steps };
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
