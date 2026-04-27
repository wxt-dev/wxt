import { debounce } from 'perfect-debounce';
import { Mutex } from 'async-mutex';
import { relative } from 'node:path';
import { BuildStepOutput, EntrypointGroup, WxtDevServer } from '../../types';
import { wxt } from '../wxt';
import { detectDevChanges, findEntrypoints, rebuild } from './building';
import { getEntrypointBundlePath, isHtmlEntrypoint } from './entrypoints';
import { getContentScriptCssFiles, getContentScriptsCssMap } from './manifest';
import {
  getContentScriptJs,
  mapWxtOptionsToRegisteredContentScript,
} from './content-scripts';
import { isBabelSyntaxError, logBabelSyntaxError } from './syntax-errors';
import { styleText } from 'node:util';

/**
 * Returns a function responsible for reloading different parts of the extension
 * when a file changes.
 */
export function createFileReloader(server: WxtDevServer) {
  const fileChangedMutex = new Mutex();
  const changeQueue: Array<[string, string]> = [];

  const cb = async (event: string, path: string) => {
    changeQueue.push([event, path]);

    const reloading = fileChangedMutex.runExclusive(async () => {
      if (server.currentOutput == null) return;

      const fileChanges = changeQueue
        .splice(0, changeQueue.length)
        .map(([_, file]) => file);
      if (fileChanges.length === 0) return;

      await wxt.reloadConfig();

      const changes = detectDevChanges(fileChanges, server.currentOutput);
      if (changes.type === 'no-change') return;

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

      // Log the entrypoints that were effected
      wxt.logger.info(
        `Changed: ${Array.from(new Set(fileChanges))
          .map((file) => styleText('dim', relative(wxt.config.root, file)))
          .join(', ')}`,
      );

      // Rebuild entrypoints on change
      const allEntrypoints = await findEntrypoints();
      try {
        const { output: newOutput } = await rebuild(
          allEntrypoints,
          // TODO: this excludes new entrypoints, so they're not built until the dev command is restarted
          changes.rebuildGroups,
          changes.cachedOutput,
        );
        server.currentOutput = newOutput;

        // Perform reloads
        switch (changes.type) {
          case 'extension-reload':
            server.reloadExtension();
            wxt.logger.success(`Reloaded extension`);
            break;
          case 'html-reload':
            const { reloadedNames } = reloadHtmlPages(
              changes.rebuildGroups,
              server,
            );
            wxt.logger.success(`Reloaded: ${getFilenameList(reloadedNames)}`);
            break;
          case 'content-script-reload':
            reloadContentScripts(changes.changedSteps, server);

            const rebuiltNames = changes.rebuildGroups
              .flat()
              .map((entry) => entry.name);
            wxt.logger.success(`Reloaded: ${getFilenameList(rebuiltNames)}`);
            break;
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

  return debounce(cb, wxt.config.dev.server!.watchDebounce, {
    leading: true,
    trailing: false,
  });
}

/**
 * From the server, tell the client to reload content scripts from the provided
 * build step outputs.
 */
function reloadContentScripts(steps: BuildStepOutput[], server: WxtDevServer) {
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
    .map((name) => styleText('cyan', name))
    .join(styleText('dim', ', '));
}
