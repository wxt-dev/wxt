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
  const relativePaths = await glob(Object.keys(PATH_GLOB_TO_TYPE_MAP), {
    cwd: config.entrypointsDir,
  });
  // Ensure consistent output
  relativePaths.sort();

  const pathGlobs = Object.keys(PATH_GLOB_TO_TYPE_MAP);
  const entrypointInfos: EntrypointInfo[] = relativePaths.reduce<
    EntrypointInfo[]
  >((results, relativePath) => {
    const inputPath = resolve(config.entrypointsDir, relativePath);
    const name = getEntrypointName(config.entrypointsDir, inputPath);
    const matchingGlob = pathGlobs.find((glob) =>
      minimatch(relativePath, glob),
    );
    if (matchingGlob) {
      const type = PATH_GLOB_TO_TYPE_MAP[matchingGlob];
      results.push({
        name,
        inputPath,
        type,
        skipped:
          Array.isArray(config.filterEntrypoints) &&
          !config.filterEntrypoints.includes(name),
      });
    }
    return results;
  }, []);

  // Validation
  preventNoEntrypoints(config, entrypointInfos);
  preventDuplicateEntrypointNames(config, entrypointInfos);

  // Import entrypoints to get their config
  let hasBackground = false;
  const entrypoints: Entrypoint[] = await Promise.all(
    entrypointInfos.map(async (info): Promise<Entrypoint> => {
      const { type } = info;
      switch (type) {
        case 'popup':
          return await getPopupEntrypoint(config, info);
        case 'options':
          return await getOptionsEntrypoint(config, info);
        case 'background':
          hasBackground = true;
          return await getBackgroundEntrypoint(config, info);
        case 'content-script':
          return await getContentScriptEntrypoint(config, info);
        case 'unlisted-page':
          return await getUnlistedPageEntrypoint(config, info);
        case 'unlisted-script':
          return await getUnlistedScriptEntrypoint(config, info);
        case 'content-script-style':
          return {
            ...info,
            type,
            outputDir: resolve(config.outDir, CONTENT_SCRIPT_OUT_DIR),
            options: {
              include: undefined,
              exclude: undefined,
            },
          };
        default:
          return {
            ...info,
            type,
            outputDir: config.outDir,
            options: {
              include: undefined,
              exclude: undefined,
            },
          };
      }
    }),
  );

  if (config.command === 'serve' && !hasBackground) {
    entrypoints.push(
      await getBackgroundEntrypoint(config, {
        inputPath: VIRTUAL_NOOP_BACKGROUND_MODULE_ID,
        name: 'background',
        type: 'background',
        skipped: false,
      }),
    );
  }

  config.logger.debug('All entrypoints:', entrypoints);
  const skippedEntrypointNames = entrypointInfos
    .filter((item) => item.skipped)
    .map((item) => item.name);
  if (skippedEntrypointNames.length) {
    config.logger.warn(
      `The follow entrypoints is ignored after filtered:\n${skippedEntrypointNames
        .map((item) => {
          return `- ${item}`;
        })
        .join('\n')}`,
    );
  }
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
    if (skippedEntrypointNames.includes(entry.name)) {
      return false;
    }

    return true;
  });
  config.logger.debug(`${config.browser} entrypoints:`, targetEntrypoints);
  return targetEntrypoints;
}

interface EntrypointInfo {
  name: string;
  inputPath: string;
  type: Entrypoint['type'];
  /**
   * @default false
   */
  skipped: boolean;
}

function preventDuplicateEntrypointNames(
  config: InternalConfig,
  files: EntrypointInfo[],
) {
  const namesToPaths = files.reduce<Record<string, string[]>>(
    (map, { name, inputPath }) => {
      map[name] ??= [];
      map[name].push(inputPath);
      return map;
    },
    {},
  );
  const errorLines = Object.entries(namesToPaths).reduce<string[]>(
    (lines, [name, absolutePaths]) => {
      if (absolutePaths.length > 1) {
        lines.push(`- ${name}`);
        absolutePaths.forEach((absolutePath) => {
          lines.push(`  - ${relative(config.root, absolutePath)}`);
        });
      }
      return lines;
    },
    [],
  );
  if (errorLines.length > 0) {
    const errorContent = errorLines.join('\n');
    throw Error(
      `Multiple entrypoints with the same name detected, only one entrypoint for each name is allowed.\n\n${errorContent}`,
    );
  }
}

function preventNoEntrypoints(config: InternalConfig, files: EntrypointInfo[]) {
  if (files.length === 0) {
    throw Error(`No entrypoints found in ${config.entrypointsDir}`);
  }
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
  { inputPath, name, skipped }: EntrypointInfo,
): Promise<PopupEntrypoint> {
  const content = await fs.readFile(inputPath, 'utf-8');
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
    inputPath,
    outputDir: config.outDir,
    skipped,
  };
}

/**
 * @param path Absolute path to the options HTML file.
 * @param content String contents of the file at the path.
 */
async function getOptionsEntrypoint(
  config: InternalConfig,
  { inputPath, name, skipped }: EntrypointInfo,
): Promise<OptionsEntrypoint> {
  const content = await fs.readFile(inputPath, 'utf-8');
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
    inputPath,
    outputDir: config.outDir,
    skipped,
  };
}

/**
 * @param path Absolute path to the HTML file.
 * @param content String contents of the file at the path.
 */
async function getUnlistedPageEntrypoint(
  config: InternalConfig,
  { inputPath, name, skipped }: EntrypointInfo,
): Promise<GenericEntrypoint> {
  const content = await fs.readFile(inputPath, 'utf-8');
  const { document } = parseHTML(content);

  return {
    type: 'unlisted-page',
    name: getEntrypointName(config.entrypointsDir, inputPath),
    inputPath,
    outputDir: config.outDir,
    options: getHtmlBaseOptions(document),
    skipped,
  };
}

/**
 * @param path Absolute path to the script's file.
 * @param content String contents of the file at the path.
 */
async function getUnlistedScriptEntrypoint(
  config: InternalConfig,
  { inputPath, name, skipped }: EntrypointInfo,
): Promise<GenericEntrypoint> {
  const defaultExport = await importEntrypointFile<UnlistedScriptDefinition>(
    inputPath,
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
    inputPath,
    outputDir: config.outDir,
    options,
    skipped,
  };
}

/**
 * @param path Absolute path to the background's TS file.
 */
async function getBackgroundEntrypoint(
  config: InternalConfig,
  { inputPath, name, skipped }: EntrypointInfo,
): Promise<BackgroundEntrypoint> {
  let options: Omit<BackgroundDefinition, 'main'> = {};
  if (inputPath !== VIRTUAL_NOOP_BACKGROUND_MODULE_ID) {
    const defaultExport = await importEntrypointFile<BackgroundDefinition>(
      inputPath,
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
    inputPath,
    outputDir: config.outDir,
    options: {
      ...options,
      type: resolvePerBrowserOption(options.type, config.browser),
      persistent: resolvePerBrowserOption(options.persistent, config.browser),
    },
    skipped,
  };
}

/**
 * @param path Absolute path to the content script's TS file.
 */
async function getContentScriptEntrypoint(
  config: InternalConfig,
  { inputPath, name, skipped }: EntrypointInfo,
): Promise<ContentScriptEntrypoint> {
  const { main: _, ...options } =
    await importEntrypointFile<ContentScriptDefinition>(inputPath, config);
  if (options == null) {
    throw Error(
      `${name}: Default export not found, did you forget to call "export default defineContentScript(...)"?`,
    );
  }
  return {
    type: 'content-script',
    name,
    inputPath,
    outputDir: resolve(config.outDir, CONTENT_SCRIPT_OUT_DIR),
    options,
    skipped,
  };
}

const PATH_GLOB_TO_TYPE_MAP: Record<string, Entrypoint['type']> = {
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
  '*.[jt]s?(x)': 'unlisted-script',
  '*/index.[jt]s?(x)': 'unlisted-script',
  [`*.${CSS_EXTENSIONS_PATTERN}`]: 'unlisted-style',
  [`*/index.${CSS_EXTENSIONS_PATTERN}`]: 'unlisted-style',
};

const CONTENT_SCRIPT_OUT_DIR = 'content-scripts';
