import { resolve } from 'path';
import {
  BackgroundEntrypoint,
  BackgroundScriptDefintition,
  ContentScriptDefinition,
  ContentScriptEntrypoint,
  Entrypoint,
  InternalConfig,
  OptionsEntrypoint,
  PopupEntrypoint,
} from '../types';
import fs from 'fs-extra';
import picomatch from 'picomatch';
import { parseHTML } from 'linkedom';
import JSON5 from 'json5';
import { importTsFile } from './importTsFile';
import glob from 'fast-glob';

/**
 * Return entrypoints and their configuration by looking through the
 */
export async function findEntrypoints(
  config: FindEntrypointsConfig,
): Promise<Entrypoint[]> {
  const relativePaths = await glob('**/*', {
    cwd: config.entrypointsDir,
  });
  // Ensure consistent output
  relativePaths.sort();

  const pathGlobs = Object.keys(PATH_GLOB_TO_TYPE_MAP);

  const entrypoints: Entrypoint[] = [];
  await Promise.all(
    relativePaths.map(async (relativePath) => {
      const path = resolve(config.entrypointsDir, relativePath);
      const matchingGlob = pathGlobs.find((glob) =>
        picomatch.isMatch(relativePath, glob),
      );

      if (matchingGlob == null) {
        return config.logger.warn(
          `${relativePath} does not match any known entrypoint. Known entrypoints:\n${JSON.stringify(
            PATH_GLOB_TO_TYPE_MAP,
            null,
            2,
          )}`,
        );
      }

      const type = PATH_GLOB_TO_TYPE_MAP[matchingGlob];
      if (type === 'ignored') return;

      let entrypoint: Entrypoint;
      switch (type) {
        case 'popup':
          entrypoint = await getPopupEntrypoint(config, path);
          break;
        case 'options':
          entrypoint = await getOptionsEntrypoint(config, path);
          break;
        case 'background':
          entrypoint = await getBackgroundEntrypoint(config, path);
          break;
        case 'content-script':
          entrypoint = await getContentScriptEntrypoint(
            config,
            relativePath.split('.', 2)[0],
            path,
          );
          break;
        default:
          const name = relativePath.split(/[\.\/]/, 2)[0];
          const outDir =
            name === type || type.startsWith('unlisted')
              ? name
              : `${name}.${type}`;
          entrypoint = {
            type,
            inputPath: path,
            outputDir: resolve(config.outDir, outDir),
          };
      }

      entrypoints.push(entrypoint);
    }),
  );
  return entrypoints;
}

/**
 * @param path Absolute path to the popup HTML file.
 * @param content String contents of the file at the path.
 */
async function getPopupEntrypoint(
  config: FindEntrypointsConfig,
  path: string,
): Promise<PopupEntrypoint> {
  const options: PopupEntrypoint['options'] = {};

  const content = await fs.readFile(path, 'utf-8');
  const { document } = parseHTML(content);
  const title = document.querySelector('title');
  if (title != null) options.defaultTitle = title.textContent ?? undefined;
  const defaultIconContent = document
    .querySelector("meta[name='manifest.default_icon']")
    ?.getAttribute('content');
  if (defaultIconContent) {
    try {
      options.defaultIcon = JSON5.parse(defaultIconContent);
    } catch (err) {
      config.logger.fatal(
        `Failed to parse default_icon meta tag content as JSON5. content=${defaultIconContent}`,
        err,
      );
    }
  }

  return {
    type: 'popup',
    options,
    inputPath: path,
    outputDir: resolve(config.outDir, 'popup'),
  };
}

/**
 * @param path Absolute path to the options HTML file.
 * @param content String contents of the file at the path.
 */
async function getOptionsEntrypoint(
  config: FindEntrypointsConfig,
  path: string,
): Promise<OptionsEntrypoint> {
  const options: OptionsEntrypoint['options'] = {};

  const content = await fs.readFile(path, 'utf-8');
  const { document } = parseHTML(content);
  const defaultIconContent = document
    .querySelector("meta[name='manifest.open_in_tab']")
    ?.getAttribute('content');
  if (defaultIconContent) {
    options.openInTab = Boolean(defaultIconContent);
  }

  return {
    type: 'options',
    options,
    inputPath: path,
    outputDir: resolve(config.outDir, 'options'),
  };
}

/**
 * @param path Absolute path to the background's TS file.
 */
async function getBackgroundEntrypoint(
  config: FindEntrypointsConfig,
  path: string,
): Promise<BackgroundEntrypoint> {
  const { main: _, ...options } =
    await importTsFile<BackgroundScriptDefintition>(path);
  if (options == null) {
    throw Error('Background script does not have a default export');
  }
  return {
    type: 'background',
    inputPath: path,
    outputDir: resolve(config.outDir, 'background'),
    options: options,
  };
}

/**
 * @param path Absolute path to the content script's TS file.
 */
async function getContentScriptEntrypoint(
  config: FindEntrypointsConfig,
  name: string,
  path: string,
): Promise<ContentScriptEntrypoint> {
  const { main: _, ...options } = await importTsFile<ContentScriptDefinition>(
    path,
  );
  if (options == null) {
    throw Error(`Content script ${name} does not have a default export`);
  }
  return {
    type: 'content-script',
    inputPath: path,
    outputDir: resolve(config.outDir, 'content-scripts', name),
    options,
  };
}

const PATH_GLOB_TO_TYPE_MAP: Record<string, Entrypoint['type'] | 'ignored'> = {
  'sandbox.html': 'sandbox',
  'sandbox/index.html': 'sandbox',
  '*.sandbox.html': 'sandbox',
  '*.sandbox/index.html': 'sandbox',

  'bookmarks.html': 'bookmarks',
  'bookmarks/index.html': 'bookmarks',

  'history.html': 'history',
  'history/index.html': 'history',

  'newtab.html': 'newtab',
  'newtab/index.html': 'newtab',

  'sidepanel.html': 'sidepanel',
  'sidepanel/index.html': 'sidepanel',
  '*.sidepanel.html': 'sidepanel',
  '*.sidepanel/index.html': 'sidepanel',

  'devtools.html': 'devtools',
  'devtools/index.html': 'devtools',

  'background.ts': 'background',

  '*.content.ts': 'content-script',
  '*.content/index.ts': 'content-script',

  'popup.html': 'popup',
  'popup/index.html': 'popup',

  'options.html': 'options',
  'options/index.html': 'options',

  '*.html': 'unlisted-page',
  '*/index.html': 'unlisted-page',
  '*.ts': 'unlisted-script',

  // Don't warn about any files in subdirectories, like CSS or JS entrypoints for HTML files
  '*/*': 'ignored',
};

export type FindEntrypointsConfig = Pick<
  InternalConfig,
  'entrypointsDir' | 'outDir' | 'logger' | 'mode' | 'command'
>;
