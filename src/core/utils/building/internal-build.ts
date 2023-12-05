import { findEntrypoints } from './find-entrypoints';
import { InternalConfig, BuildOutput } from '~/types';
import pc from 'picocolors';
import fs from 'fs-extra';
import { groupEntrypoints } from './group-entrypoints';
import { formatDuration } from '~/core/utils/time';
import { printBuildSummary } from '~/core/utils/log';
import glob from 'fast-glob';
import { unnormalizePath } from '~/core/utils/paths';
import { rebuild } from './rebuild';

/**
 * Builds the extension based on an internal config. No more config discovery is performed, the
 * build is based on exactly what is passed in.
 *
 * This function:
 * 1. Cleans the output directory
 * 2. Executes the rebuild function with a blank previous output so everything is built (see
 *    `rebuild` for more details)
 * 3. Prints the summary
 */
export async function internalBuild(
  config: InternalConfig,
): Promise<BuildOutput> {
  const verb = config.command === 'serve' ? 'Pre-rendering' : 'Building';
  const target = `${config.browser}-mv${config.manifestVersion}`;
  config.logger.info(
    `${verb} ${pc.cyan(target)} for ${pc.cyan(config.mode)} with ${pc.green(
      `${config.builder.name} ${config.builder.version}`,
    )}`,
  );
  const startTime = Date.now();

  // Cleanup
  await fs.rm(config.outDir, { recursive: true, force: true });
  await fs.ensureDir(config.outDir);

  const entrypoints = await findEntrypoints(config);
  config.logger.debug('Detected entrypoints:', entrypoints);
  const groups = groupEntrypoints(entrypoints);
  const { output } = await rebuild(config, groups, undefined);

  // Post-build
  await printBuildSummary(
    config.logger.success,
    `Built extension in ${formatDuration(Date.now() - startTime)}`,
    output,
    config,
  );

  if (config.analysis.enabled) {
    await combineAnalysisStats(config);
    config.logger.info(
      `Analysis complete:\n  ${pc.gray('└─')} ${pc.yellow('stats.html')}`,
    );
  }

  return output;
}

async function combineAnalysisStats(config: InternalConfig): Promise<void> {
  const { execaCommand } = await import('execa');
  const unixFiles = await glob(`stats-*.json`, {
    cwd: config.outDir,
    absolute: true,
  });
  const absolutePaths = unixFiles.map(unnormalizePath);

  await execaCommand(
    `rollup-plugin-visualizer ${absolutePaths.join(' ')} --template ${
      config.analysis.template
    }`,
    { cwd: config.root, stdio: 'inherit' },
  );
}
