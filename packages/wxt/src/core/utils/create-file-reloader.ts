import { Mutex } from 'async-mutex';
import pc from 'picocolors';
import { relative } from 'node:path';
import {
  BuildOutput,
  BuildStepOutput,
  EntrypointGroup,
  WxtDevServer,
} from '../../types';
import { wxt } from '../wxt';
import {
  detectDevChanges,
  findEntrypoints,
  getRelevantDevChangedFiles,
  groupEntrypoints,
  rebuild,
} from './building';
import { getEntrypointBundlePath, isHtmlEntrypoint } from './entrypoints';
import { getContentScriptCssFiles, getContentScriptsCssMap } from './manifest';
import {
  getContentScriptJs,
  mapWxtOptionsToRegisteredContentScript,
} from './content-scripts';
import { filterTruthy, toArray } from './arrays';
import { normalizePath } from './paths';
import { isBabelSyntaxError, logBabelSyntaxError } from './syntax-errors';

/**
 * Returns a function responsible for reloading different parts of the extension when a file
 * changes.
 */
export function createFileReloader(server: WxtDevServer) {
  const fileChangedMutex = new Mutex();
  const changeQueue: Array<[string, string]> = [];
  let processLoop: Promise<void> | undefined;

  const processQueue = async () => {
    const reloading = fileChangedMutex.runExclusive(async () => {
      const fileChanges = changeQueue
        .splice(0, changeQueue.length)
        .map(([_, file]) => file);
      if (fileChanges.length === 0) return;
      if (server.currentOutput == null) return;

      const normalizedFileChanges = fileChanges.map(normalizePath);
      const relevantFileChanges = getRelevantDevChangedFiles(
        fileChanges,
        server.currentOutput,
      );
      const normalizedEntrypointsDir = normalizePath(wxt.config.entrypointsDir);
      const hasEntrypointDirChange = normalizedFileChanges.some(
        (file) =>
          file === normalizedEntrypointsDir ||
          file.startsWith(`${normalizedEntrypointsDir}/`),
      );
      if (relevantFileChanges.length === 0 && !hasEntrypointDirChange) return;

      await wxt.reloadConfig();
      const allEntrypoints = await findEntrypoints();
      const allEntrypointGroups = groupEntrypoints(allEntrypoints);
      const newEntrypointGroups = getNewEntrypointGroups(
        normalizedFileChanges,
        allEntrypointGroups,
        server.currentOutput,
      );
      if (relevantFileChanges.length === 0 && newEntrypointGroups.length === 0)
        return;

      const changes = detectDevChanges(
        relevantFileChanges,
        server.currentOutput,
      );

      if (changes.type === 'full-restart') {
        wxt.logger.info('Config changed, restarting server...');
        server.restart();
        return;
      }

      if (changes.type === 'browser-restart') {
        wxt.logger.info('Runner config changed, restarting browser...');
        server.restartBrowser();
        return;
      }
      if (changes.type === 'no-change' && newEntrypointGroups.length === 0)
        return;

      const changedFilesToLog = Array.from(
        new Set([
          ...relevantFileChanges,
          ...newEntrypointGroups
            .flatMap((group) => toArray(group))
            .map((entry) => entry.inputPath),
        ]),
      );

      // Log the entrypoints that were effected
      wxt.logger.info(
        `Changed: ${changedFilesToLog
          .map((file) => pc.dim(relative(wxt.config.root, file)))
          .join(', ')}`,
      );

      // Rebuild entrypoints on change
      const rebuildGroups =
        changes.type === 'no-change'
          ? newEntrypointGroups
          : mergeEntrypointGroups(
              getLatestRebuildGroups(
                changes.rebuildGroups,
                allEntrypointGroups,
              ),
              newEntrypointGroups,
            );
      try {
        const { output: newOutput } = await rebuild(
          allEntrypoints,
          rebuildGroups,
          changes.type === 'no-change'
            ? server.currentOutput
            : changes.cachedOutput,
        );
        server.currentOutput = newOutput;

        // Perform reloads
        const needsFullExtensionReload =
          newEntrypointGroups.length > 0 ||
          changes.type === 'extension-reload' ||
          changes.type === 'no-change';
        if (needsFullExtensionReload) {
          server.reloadExtension();
          wxt.logger.success(`Reloaded extension`);
        } else if (changes.type === 'html-reload') {
          const { reloadedNames } = reloadHtmlPages(rebuildGroups, server);
          wxt.logger.success(`Reloaded: ${getFilenameList(reloadedNames)}`);
        } else {
          reloadContentScripts(changes.changedSteps, server);

          const rebuiltNames = rebuildGroups.flat().map((entry) => entry.name);
          wxt.logger.success(`Reloaded: ${getFilenameList(rebuiltNames)}`);
        }
      } catch {
        // Catch build errors instead of crashing. Don't log error either, builder should have already logged it
      }
    });

    await reloading.catch((error) => {
      if (!isBabelSyntaxError(error)) {
        throw error;
      }
      // Log syntax errors without crashing the server.
      logBabelSyntaxError(error);
    });
  };

  const waitForDebounceWindow = async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, wxt.config.dev.server!.watchDebounce);
    });
  };

  const queueWorker = async () => {
    while (true) {
      await processQueue();

      await waitForDebounceWindow();
      if (changeQueue.length === 0) break;
    }
  };

  return async (event: string, path: string) => {
    // Queue every event before debouncing so we never drop changes.
    changeQueue.push([event, path]);

    processLoop ??= queueWorker().finally(() => {
      processLoop = undefined;
    });
    await processLoop;
  };
}

function getNewEntrypointGroups(
  normalizedFileChanges: string[],
  allEntrypointGroups: EntrypointGroup[],
  currentOutput: BuildOutput,
): EntrypointGroup[] {
  const changedFiles = new Set(normalizedFileChanges);
  const builtEntrypointPaths = new Set(
    currentOutput.steps.flatMap((step) =>
      toArray(step.entrypoints).map((entry) => normalizePath(entry.inputPath)),
    ),
  );

  return allEntrypointGroups.filter((group) => {
    const groupEntrypoints = toArray(group);
    const hasNewEntrypoint = groupEntrypoints.some(
      (entry) => !builtEntrypointPaths.has(normalizePath(entry.inputPath)),
    );
    const changedEntrypoint = groupEntrypoints.some((entry) =>
      changedFiles.has(normalizePath(entry.inputPath)),
    );
    return hasNewEntrypoint && changedEntrypoint;
  });
}

function getLatestRebuildGroups(
  rebuildGroups: EntrypointGroup[],
  allEntrypointGroups: EntrypointGroup[],
): EntrypointGroup[] {
  const groupByEntrypointPath = new Map<string, EntrypointGroup>();

  allEntrypointGroups.forEach((group) => {
    toArray(group).forEach((entry) => {
      groupByEntrypointPath.set(normalizePath(entry.inputPath), group);
    });
  });

  return mergeEntrypointGroups(
    rebuildGroups.flatMap((group) => {
      return filterTruthy(
        toArray(group).map((entry) =>
          groupByEntrypointPath.get(normalizePath(entry.inputPath)),
        ),
      );
    }),
  );
}

function mergeEntrypointGroups(
  ...groups: EntrypointGroup[][]
): EntrypointGroup[] {
  const deduped = new Map<string, EntrypointGroup>();

  groups.flat().forEach((group) => {
    deduped.set(getEntrypointGroupKey(group), group);
  });

  return [...deduped.values()];
}

function getEntrypointGroupKey(group: EntrypointGroup): string {
  return toArray(group)
    .map((entry) => normalizePath(entry.inputPath))
    .sort()
    .join('|');
}

/**
 * From the server, tell the client to reload content scripts from the provided build step outputs.
 */
export function reloadContentScripts(
  steps: BuildStepOutput[],
  server: WxtDevServer,
) {
  if (wxt.config.manifestVersion === 3) {
    steps.forEach((step) => {
      if (server.currentOutput == null) return;

      const entry = step.entrypoints;
      if (Array.isArray(entry) || entry.type !== 'content-script') return;

      const js = getContentScriptJs(wxt.config, entry);
      const cssMap = getContentScriptsCssMap(server.currentOutput, [entry]);
      const css = getContentScriptCssFiles([entry], cssMap);

      server.reloadContentScript({
        registration: entry.options.registration,
        contentScript: mapWxtOptionsToRegisteredContentScript(
          entry.options,
          js,
          css,
        ),
      });
    });
  } else {
    server.reloadExtension();
  }
}

function reloadHtmlPages(
  groups: EntrypointGroup[],
  server: WxtDevServer,
): { reloadedNames: string[] } {
  // groups might contain other files like background/content scripts, and we only care about the HTMl pages
  const htmlEntries = groups.flat().filter(isHtmlEntrypoint);

  htmlEntries.forEach((entry) => {
    const path = getEntrypointBundlePath(entry, wxt.config.outDir, '.html');
    server.reloadPage(path);
  });

  return {
    reloadedNames: htmlEntries.map((entry) => entry.name),
  };
}

function getFilenameList(names: string[]): string {
  return names
    .map((name) => {
      return pc.cyan(name);
    })
    .join(pc.dim(', '));
}
