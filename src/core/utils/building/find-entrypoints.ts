import { relative, resolve } from 'path';
import {
  BackgroundEntrypoint,
  BackgroundDefinition,
  BaseEntrypointOptions,
  ContentScriptDefinition,
  ContentScriptEntrypoint,
  Entrypoint,
  GenericEntrypoint,
  InternalConfig,
  OptionsEntrypoint,
  PopupEntrypoint,
  UnlistedScriptDefinition,
} from '~/types';
import fs from 'fs-extra';
import { minimatch } from 'minimatch';
import { parseHTML } from 'linkedom';
import JSON5 from 'json5';
import { importEntrypointFile } from '~/core/utils/building';
import glob from 'fast-glob';
import {
  getEntrypointName,
  resolvePerBrowserOption,
} from '~/core/utils/entrypoints';
import { VIRTUAL_NOOP_BACKGROUND_MODULE_ID } from '~/core/utils/constants';
import { CSS_EXTENSIONS_PATTERN } from '~/core/utils/paths';

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

  let hasBackground = false;
  // TODO: This parallelization is bad
  const possibleEntrypoints: Array<Entrypoint | undefined> = await Promise.all(
    relativePaths.map(async (relativePath) => {
      const path = resolve(config.entrypointsDir, relativePath);
      const matchingGlob = pathGlobs.find((glob) =>
        minimatch(relativePath, glob),
      );

      if (matchingGlob == null) {
        config.logger.warn(
          `${relativePath} does not match any known entrypoint. Known entrypoints:\n${JSON.stringify(
            PATH_GLOB_TO_TYPE_MAP,
            null,
            2,
          )}`,
        );
        return;
      }

      const type = PATH_GLOB_TO_TYPE_MAP[matchingGlob];
      if (type === 'ignored') return;

      switch (type) {
        case 'popup':
          return await getPopupEntrypoint(config, path);
        case 'options':
          return await getOptionsEntrypoint(config, path);
        case 'background':
          hasBackground = true;
          return await getBackgroundEntrypoint(config, path);
        case 'content-script':
          return await getContentScriptEntrypoint(config, path);
        case 'unlisted-page':
          return await getUnlistedPageEntrypoint(config, path);
        case 'unlisted-script':
          return await getUnlistedScriptEntrypoint(config, path);
        case 'content-script-style':
          return {
            type,
            name: getEntrypointName(config.entrypointsDir, path),
            inputPath: path,
            outputDir: resolve(config.outDir, CONTENT_SCRIPT_OUT_DIR),
            options: {
              include: undefined,
              exclude: undefined,
            },
          };
        default:
          return {
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
    }),
  );

  const entrypoints = possibleEntrypoints.filter(
    (entry) => !!entry,
  ) as Entrypoint[];

  // Report duplicate entrypoint names
  const existingNames: Record<string, Entrypoint | undefined> = {};
  entrypoints.forEach((entrypoint) => {
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
    existingNames[entrypoint.name] = entrypoint;
  });

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

  const mv2TypeContent = document
    .querySelector("meta[name='manifest.type']")
    ?.getAttribute('content');
  if (mv2TypeContent) {
    options.mv2Key =
      mv2TypeContent === 'page_action' ? 'page_action' : 'browser_action';
  }

  const browserStyleContent = document
    .querySelector("meta[name='manifest.browser_style']")
    ?.getAttribute('content');
  if (browserStyleContent) {
    options.browserStyle = browserStyleContent === 'true';
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
 * @param path Absolute path to the script's file.
 * @param content String contents of the file at the path.
 */
async function getUnlistedScriptEntrypoint(
  config: InternalConfig,
  path: string,
): Promise<GenericEntrypoint> {
  const name = getEntrypointName(config.entrypointsDir, path);
  const defaultExport = await importEntrypointFile<UnlistedScriptDefinition>(
    path,
    config,
  );
  if (defaultExport == null) {
    throw Error(
      `${name}: Default export not found, did you forget to call "export default defineUnlistedScript(...)"?`,
    );
  }
  const { main: _, ...moduleOptions } = defaultExport;
  const options: Omit<UnlistedScriptDefinition, 'main'> = moduleOptions;
  return {
    type: 'unlisted-script',
    name,
    inputPath: path,
    outputDir: config.outDir,
    options,
  };
}

/**
 * @param path Absolute path to the background's TS file.
 */
async function getBackgroundEntrypoint(
  config: InternalConfig,
  path: string,
): Promise<BackgroundEntrypoint> {
  const name = 'background';
  let options: Omit<BackgroundDefinition, 'main'> = {};
  if (path !== VIRTUAL_NOOP_BACKGROUND_MODULE_ID) {
    const defaultExport = await importEntrypointFile<BackgroundDefinition>(
      path,
      config,
    );
    if (defaultExport == null) {
      throw Error(
        `${name}: Default export not found, did you forget to call "export default defineBackground(...)"?`,
      );
    }
    const { main: _, ...moduleOptions } = defaultExport;
    options = moduleOptions;
  }
  return {
    type: 'background',
    name,
    inputPath: path,
    outputDir: config.outDir,
    options: {
      ...options,
      type: resolvePerBrowserOption(options.type, config.browser),
      persistent: resolvePerBrowserOption(options.persistent, config.browser),
    },
  };
}

/**
 * @param path Absolute path to the content script's TS file.
 */
async function getContentScriptEntrypoint(
  config: InternalConfig,
  path: string,
): Promise<ContentScriptEntrypoint> {
  const name = getEntrypointName(config.entrypointsDir, path);
  const { main: _, ...options } =
    await importEntrypointFile<ContentScriptDefinition>(path, config);
  if (options == null) {
    throw Error(
      `${name}: Default export not found, did you forget to call "export default defineContentScript(...)"?`,
    );
  }
  return {
    type: 'content-script',
    name,
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

  'background.[jt]s': 'background',
  'background/index.[jt]s': 'background',
  [VIRTUAL_NOOP_BACKGROUND_MODULE_ID]: 'background',

  'content.[jt]s?(x)': 'content-script',
  'content/index.[jt]s?(x)': 'content-script',
  '*.content.[jt]s?(x)': 'content-script',
  '*.content/index.[jt]s?(x)': 'content-script',
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
  '*.[jt]s': 'unlisted-script',
  '*/index.ts': 'unlisted-script',
  [`*.${CSS_EXTENSIONS_PATTERN}`]: 'unlisted-style',
  [`*/index.${CSS_EXTENSIONS_PATTERN}`]: 'unlisted-style',

  // Don't warn about any files in subdirectories, like CSS or JS entrypoints for HTML files or tests
  '*/**': 'ignored',
};

const CONTENT_SCRIPT_OUT_DIR = 'content-scripts';
