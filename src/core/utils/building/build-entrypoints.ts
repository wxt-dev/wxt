import {
  BuildOutput,
  BuildStepOutput,
  EntrypointGroup,
  InternalConfig,
} from '~/types';
import { getPublicFiles } from '~/core/utils/fs';
import fs from 'fs-extra';
import { dirname, resolve, extname } from 'node:path';
import type { Ora } from 'ora';
import pc from 'picocolors';
import { unnormalizePath } from '~/core/utils/paths';
import { convertMessagesToManifest, readMessagesFile } from '~/i18n/node';

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

  const publicAssets = (
    await Promise.all([
      copyPublicDirectory(config),
      copyLocalesDirectory(config),
    ])
  ).flat();

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
    });
  }

  return publicAssets;
}

async function copyLocalesDirectory(
  config: InternalConfig,
): Promise<BuildOutput['publicAssets']> {
  const localesExist = await fs.exists(config.localesDir);
  if (!localesExist || config.manifest.default_locale == null) return [];

  const files = await fs.readdir(config.localesDir);

  return await Promise.all(
    files.map(async (file) => {
      const locale = file.replace(extname(file), '');
      const fileName = unnormalizePath(`_locales/${locale}/messages.json`);
      const srcPath = resolve(config.localesDir, file);
      const outPath = resolve(config.outDir, fileName);

      const messages = await readMessagesFile(srcPath);
      const json = convertMessagesToManifest(messages);

      await fs.ensureDir(dirname(outPath));
      await fs.writeJson(outPath, json);
      return {
        fileName,
        type: 'asset',
      };
    }),
  );
}
