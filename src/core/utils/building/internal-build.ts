import { findEntrypoints } from './find-entrypoints';
import { BuildOutput, Entrypoint } from '~/types';
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
import { wxt } from '../../wxt';
import { mergeJsonOutputs } from '@aklinker1/rollup-plugin-visualizer';
import { isCI } from 'ci-info';
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
export async function internalBuild(): Promise<BuildOutput> {
  await wxt.hooks.callHook('build:before', wxt);

  const verb = wxt.config.command === 'serve' ? 'Pre-rendering' : 'Building';
  const target = `${wxt.config.browser}-mv${wxt.config.manifestVersion}`;
  wxt.logger.info(
    `${verb} ${pc.cyan(target)} for ${pc.cyan(wxt.config.mode)} with ${pc.green(
      `${wxt.builder.name} ${wxt.builder.version}`,
    )}`,
  );
  const startTime = Date.now();

  // Cleanup
  await fs.rm(wxt.config.outDir, { recursive: true, force: true });
  await fs.ensureDir(wxt.config.outDir);

  const entrypoints = await findEntrypoints();

  const validationResults = validateEntrypoints(entrypoints);
  if (validationResults.errorCount + validationResults.warningCount > 0) {
    printValidationResults(validationResults);
  }
  if (validationResults.errorCount > 0) {
    throw new ValidationError(`Entrypoint validation failed`, {
      cause: validationResults,
    });
  }

  const groups = groupEntrypoints(entrypoints);
  if (wxt.config.debug) {
    wxt.logger.debug(
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
  await wxt.hooks.callHook('entrypoints:grouped', wxt, groups);

  const { output, warnings } = await rebuild(entrypoints, groups, undefined);
  await wxt.hooks.callHook('build:done', wxt, output);

  // Post-build
  await printBuildSummary(
    wxt.logger.success,
    `Built extension in ${formatDuration(Date.now() - startTime)}`,
    output,
  );

  for (const warning of warnings) {
    wxt.logger.warn(...warning);
  }

  if (wxt.config.analysis.enabled) {
    await combineAnalysisStats();
    const statsPath = relative(wxt.config.root, wxt.config.analysis.outputFile);
    wxt.logger.info(
      `Analysis complete:\n  ${pc.gray('└─')} ${pc.yellow(statsPath)}`,
    );
    if (wxt.config.analysis.open) {
      if (isCI) {
        wxt.logger.debug(`Skipped opening ${pc.yellow(statsPath)} in CI`);
      } else {
        wxt.logger.info(`Opening ${pc.yellow(statsPath)} in browser...`);
        const { default: open } = await import('open');
        open(wxt.config.analysis.outputFile);
      }
    }
  }

  return output;
}

async function combineAnalysisStats(): Promise<void> {
  const unixFiles = await glob(`${wxt.config.analysis.outputName}-*.json`, {
    cwd: wxt.config.analysis.outputDir,
    absolute: true,
  });
  const absolutePaths = unixFiles.map(unnormalizePath);

  await mergeJsonOutputs({
    inputs: absolutePaths,
    template: wxt.config.analysis.template,
    filename: wxt.config.analysis.outputFile,
  });

  if (!wxt.config.analysis.keepArtifacts) {
    await Promise.all(absolutePaths.map((statsFile) => fs.remove(statsFile)));
  }
}

function printValidationResults({
  errorCount,
  errors,
  warningCount,
}: ValidationResults) {
  (errorCount > 0 ? wxt.logger.error : wxt.logger.warn)(
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
