import { relative, resolve } from 'path';
import {
  BackgroundEntrypoint,
  BackgroundScriptDefintition,
  BaseEntrypointOptions,
  ContentScriptDefinition,
  ContentScriptEntrypoint,
  Entrypoint,
  GenericEntrypoint,
  InternalConfig,
  OptionsEntrypoint,
  PopupEntrypoint,
} from '../types';
import fs from 'fs-extra';
import { minimatch } from 'minimatch';
import { parseHTML } from 'linkedom';
import JSON5 from 'json5';
import { importEntrypointFile } from '../utils/importEntrypointFile';
import glob from 'fast-glob';
import { getEntrypointName } from '../utils/entrypoints';
import { VIRTUAL_NOOP_BACKGROUND_MODULE_ID } from '../vite-plugins/noopBackground';
import { CSS_EXTENSIONS_PATTERN } from '../utils/paths';

/**
 * Return entrypoints and their configuration by looking through the project's files.
 */
export async function findEntrypoints(
  config: InternalConfig,
): Promise<Entrypoint[]> {
  const relativePaths = await glob('**/*', {
    cwd: config.entrypointsDir,
  });
  // Ensure consistent output
  relativePaths.sort();

  const pathGlobs = Object.keys(PATH_GLOB_TO_TYPE_MAP);
  const existingNames: Record<string, Entrypoint | undefined> = {};

  const entrypoints: Entrypoint[] = [];
  let hasBackground = false;
  await Promise.all(
    relativePaths.map(async (relativePath) => {
      const path = resolve(config.entrypointsDir, relativePath);
      const matchingGlob = pathGlobs.find((glob) =>
        minimatch(relativePath, glob),
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
          hasBackground = true;
          break;
        case 'content-script':
          entrypoint = await getContentScriptEntrypoint(
            config,
            getEntrypointName(config.entrypointsDir, path),
            path,
          );
          break;
        case 'unlisted-page':
          entrypoint = await getUnlistedPageEntrypoint(config, path);
          break;
        case 'content-script-style':
          entrypoint = {
            type,
            name: getEntrypointName(config.entrypointsDir, path),
            inputPath: path,
            outputDir: resolve(config.outDir, CONTENT_SCRIPT_OUT_DIR),
            options: {
              include: undefined,
              exclude: undefined,
            },
          };
          break;
        default:
          entrypoint = {
            type,
            name: getEntrypointName(config.entrypointsDir, path),
            inputPath: path,
            outputDir: config.outDir,
            options: {
              include: undefined,
              exclude: undefined,
            },
          };
      }

      const withSameName = existingNames[entrypoint.name];
      if (withSameName) {
        throw Error(
          `Multiple entrypoints with the name "${
            entrypoint.name
          }" detected, but only one is allowed: ${[
            relative(config.root, withSameName.inputPath),
            relative(config.root, entrypoint.inputPath),
          ].join(', ')}`,
        );
      }
      entrypoints.push(entrypoint);
      existingNames[entrypoint.name] = entrypoint;
    }),
  );
  if (config.command === 'serve' && !hasBackground) {
    entrypoints.push(
      await getBackgroundEntrypoint(config, VIRTUAL_NOOP_BACKGROUND_MODULE_ID),
    );
  }

  config.logger.debug('All entrypoints:', entrypoints);
  const targetEntrypoints = entrypoints.filter((entry) => {
    const { include, exclude } = entry.options;
    if (include?.length && exclude?.length) {
      config.logger.warn(
        `The ${entry.name} entrypoint lists both include and exclude, but only one can be used per entrypoint. Entrypoint ignored.`,
      );
      return false;
    }
    if (exclude?.length && !include?.length) {
      return !exclude.includes(config.browser);
    }
    if (include?.length && !exclude?.length) {
      return include.includes(config.browser);
    }

    return true;
  });
  config.logger.debug(`${config.browser} entrypoints:`, targetEntrypoints);
  return targetEntrypoints;
}

function getHtmlBaseOptions(document: Document): BaseEntrypointOptions {
  const options: BaseEntrypointOptions = {};

  const includeContent = document
    .querySelector("meta[name='manifest.include']")
    ?.getAttribute('content');
  if (includeContent) {
    options.include = JSON5.parse(includeContent);
  }

  const excludeContent = document
    .querySelector("meta[name='manifest.exclude']")
    ?.getAttribute('content');
  if (excludeContent) {
    options.exclude = JSON5.parse(excludeContent);
  }

  return options;
}

/**
 * @param path Absolute path to the popup HTML file.
 * @param content String contents of the file at the path.
 */
async function getPopupEntrypoint(
  config: InternalConfig,
  path: string,
): Promise<PopupEntrypoint> {
  const content = await fs.readFile(path, 'utf-8');
  const { document } = parseHTML(content);

  const options: PopupEntrypoint['options'] = getHtmlBaseOptions(document);

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

  const mv2KeyContent = document
    .querySelector("meta[name='manifest.type']")
    ?.getAttribute('content');
  if (mv2KeyContent) {
    options.mv2Key =
      mv2KeyContent === 'page_action' ? 'page_action' : 'browser_action';
  }

  return {
    type: 'popup',
    name: 'popup',
    options,
    inputPath: path,
    outputDir: config.outDir,
  };
}

/**
 * @param path Absolute path to the options HTML file.
 * @param content String contents of the file at the path.
 */
async function getOptionsEntrypoint(
  config: InternalConfig,
  path: string,
): Promise<OptionsEntrypoint> {
  const content = await fs.readFile(path, 'utf-8');
  const { document } = parseHTML(content);

  const options: OptionsEntrypoint['options'] = getHtmlBaseOptions(document);

  const openInTabContent = document
    .querySelector("meta[name='manifest.open_in_tab']")
    ?.getAttribute('content');
  if (openInTabContent) {
    options.openInTab = openInTabContent === 'true';
  }

  const chromeStyleContent = document
    .querySelector("meta[name='manifest.chrome_style']")
    ?.getAttribute('content');
  if (chromeStyleContent) {
    options.chromeStyle = chromeStyleContent === 'true';
  }

  const browserStyleContent = document
    .querySelector("meta[name='manifest.browser_style']")
    ?.getAttribute('content');
  if (browserStyleContent) {
    options.browserStyle = browserStyleContent === 'true';
  }

  return {
    type: 'options',
    name: 'options',
    options,
    inputPath: path,
    outputDir: config.outDir,
  };
}

/**
 * @param path Absolute path to the HTML file.
 * @param content String contents of the file at the path.
 */
async function getUnlistedPageEntrypoint(
  config: InternalConfig,
  path: string,
): Promise<GenericEntrypoint> {
  const content = await fs.readFile(path, 'utf-8');
  const { document } = parseHTML(content);

  return {
    type: 'unlisted-page',
    name: getEntrypointName(config.entrypointsDir, path),
    inputPath: path,
    outputDir: config.outDir,
    options: getHtmlBaseOptions(document),
  };
}

/**
 * @param path Absolute path to the background's TS file.
 */
async function getBackgroundEntrypoint(
  config: InternalConfig,
  path: string,
): Promise<BackgroundEntrypoint> {
  let options: Omit<BackgroundScriptDefintition, 'main'> = {};
  if (path !== VIRTUAL_NOOP_BACKGROUND_MODULE_ID) {
    const defaultExport =
      await importEntrypointFile<BackgroundScriptDefintition>(path, config);
    if (defaultExport == null) {
      throw Error('Background script does not have a default export');
    }
    const { main: _, ...moduleOptions } = defaultExport;
    options = moduleOptions;
  }
  return {
    type: 'background',
    name: 'background',
    inputPath: path,
    outputDir: config.outDir,
    options: options,
  };
}

/**
 * @param path Absolute path to the content script's TS file.
 */
async function getContentScriptEntrypoint(
  config: InternalConfig,
  name: string,
  path: string,
): Promise<ContentScriptEntrypoint> {
  const { main: _, ...options } =
    await importEntrypointFile<ContentScriptDefinition>(path, config);
  if (options == null) {
    throw Error(`Content script ${name} does not have a default export`);
  }
  return {
    type: 'content-script',
    name: getEntrypointName(config.entrypointsDir, path),
    inputPath: path,
    outputDir: resolve(config.outDir, CONTENT_SCRIPT_OUT_DIR),
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
  [VIRTUAL_NOOP_BACKGROUND_MODULE_ID]: 'background',

  'content.ts?(x)': 'content-script',
  'content/index.ts?(x)': 'content-script',
  '*.content.ts?(x)': 'content-script',
  '*.content/index.ts?(x)': 'content-script',
  [`content.${CSS_EXTENSIONS_PATTERN}`]: 'content-script-style',
  [`*.content.${CSS_EXTENSIONS_PATTERN}`]: 'content-script-style',
  [`content/index.${CSS_EXTENSIONS_PATTERN}`]: 'content-script-style',
  [`*.content/index.${CSS_EXTENSIONS_PATTERN}`]: 'content-script-style',

  'popup.html': 'popup',
  'popup/index.html': 'popup',

  'options.html': 'options',
  'options/index.html': 'options',

  '*.html': 'unlisted-page',
  '*/index.html': 'unlisted-page',
  '*.ts': 'unlisted-script',
  '*/index.ts': 'unlisted-script',
  [`*.${CSS_EXTENSIONS_PATTERN}`]: 'unlisted-style',
  [`*/index.${CSS_EXTENSIONS_PATTERN}`]: 'unlisted-style',

  // Don't warn about any files in subdirectories, like CSS or JS entrypoints for HTML files
  '*/*': 'ignored',
};

const CONTENT_SCRIPT_OUT_DIR = 'content-scripts';
