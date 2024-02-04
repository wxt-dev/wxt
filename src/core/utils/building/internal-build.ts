import { findEntrypoints } from './find-entrypoints';
import { InternalConfig, BuildOutput, Entrypoint } from '~/types';
import pc from 'picocolors';
import fs from 'fs-extra';
import { groupEntrypoints } from './group-entrypoints';
import { formatDuration } from '~/core/utils/time';
import { printBuildSummary } from '~/core/utils/log';
import glob from 'fast-glob';
import { unnormalizePath } from '~/core/utils/paths';
import { rebuild } from './rebuild';
import { relative } from 'node:path';
import {
  ValidationError,
  ValidationResult,
  ValidationResults,
  validateEntrypoints,
} from '../validation';
import consola from 'consola';
import { exec } from '../exec';
import { inspect } from 'node:util';

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

  const validationResults = validateEntrypoints(entrypoints);
  if (validationResults.errorCount + validationResults.warningCount > 0) {
    printValidationResults(config, validationResults);
  }
  if (validationResults.errorCount > 0) {
    throw new ValidationError(`Entrypoint validation failed`, {
      cause: validationResults,
    });
  }

  const groups = groupEntrypoints(entrypoints);
  if (config.debug) {
    config.logger.debug(
      'Groups:',
      inspect(
        groups.map((group) =>
          Array.isArray(group) ? group.map((entry) => entry.name) : group.name,
        ),
        undefined,
        Infinity,
        true,
      ),
    );
  }
  const { output, warnings } = await rebuild(
    config,
    entrypoints,
    groups,
    undefined,
  );

  // Post-build
  await printBuildSummary(
    config.logger.success,
    `Built extension in ${formatDuration(Date.now() - startTime)}`,
    output,
    config,
  );

  for (const warning of warnings) {
    config.logger.warn(...warning);
  }

  if (config.analysis.enabled) {
    await combineAnalysisStats(config);
    config.logger.info(
      `Analysis complete:\n  ${pc.gray('└─')} ${pc.yellow('stats.html')}`,
    );
  }

  return output;
}

async function combineAnalysisStats(config: InternalConfig): Promise<void> {
  const unixFiles = await glob(`stats-*.json`, {
    cwd: config.outDir,
    absolute: true,
  });
  const absolutePaths = unixFiles.map(unnormalizePath);

  await exec(
    config,
    'rollup-plugin-visualizer',
    [...absolutePaths, '--template', config.analysis.template],
    { cwd: config.root, stdio: 'inherit' },
  );
}

function printValidationResults(
  config: InternalConfig,
  { errorCount, errors, warningCount }: ValidationResults,
) {
  (errorCount > 0 ? config.logger.error : config.logger.warn)(
    `Entrypoint validation failed: ${errorCount} error${
      errorCount === 1 ? '' : 's'
    }, ${warningCount} warning${warningCount === 1 ? '' : 's'}`,
  );

  const cwd = process.cwd();
  const entrypointErrors = errors.reduce((map, error) => {
    const entryErrors = map.get(error.entrypoint) ?? [];
    entryErrors.push(error);
    map.set(error.entrypoint, entryErrors);
    return map;
  }, new Map<Entrypoint, ValidationResult[]>());

  Array.from(entrypointErrors.entries()).forEach(([entrypoint, errors]) => {
    consola.log(relative(cwd, entrypoint.inputPath));
    console.log();
    errors.forEach((err) => {
      const type = err.type === 'error' ? pc.red('ERROR') : pc.yellow('WARN');
      const recieved = pc.dim(`(recieved: ${JSON.stringify(err.value)})`);
      consola.log(`  - ${type} ${err.message} ${recieved}`);
    });
    console.log();
  });
}
