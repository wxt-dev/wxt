import { relative, resolve } from 'path';
import {
  BackgroundEntrypoint,
  ContentScriptEntrypoint,
  Entrypoint,
  EntrypointInfo,
  GenericEntrypoint,
  OptionsEntrypoint,
  PopupEntrypoint,
  SidepanelEntrypoint,
  MainWorldContentScriptEntrypointOptions,
  IsolatedWorldContentScriptEntrypointOptions,
} from '../../../types';
import fs from 'fs-extra';
import { minimatch } from 'minimatch';
import { parseHTML } from 'linkedom';
import JSON5 from 'json5';
import glob from 'fast-glob';
import {
  getEntrypointName,
  isHtmlEntrypoint,
  isJsEntrypoint,
  resolvePerBrowserOptions,
} from '../../utils/entrypoints';
import { VIRTUAL_NOOP_BACKGROUND_MODULE_ID } from '../../utils/constants';
import { CSS_EXTENSIONS_PATTERN } from '../../utils/paths';
import pc from 'picocolors';
import { wxt } from '../../wxt';
import { camelCase } from 'scule';

/**
 * Return entrypoints and their configuration by looking through the project's files.
 */
export async function findEntrypoints(): Promise<Entrypoint[]> {
  // Make sure required TSConfig file exists to load dependencies
  await fs.mkdir(wxt.config.wxtDir, { recursive: true });
  try {
    await fs.writeJson(
      resolve(wxt.config.wxtDir, 'tsconfig.json'),
      {},
      { flag: 'wx' },
    );
  } catch (err) {
    if (!(err instanceof Error) || !('code' in err) || err.code !== 'EEXIST') {
      throw err;
    }
  }

  const relativePaths = await glob(Object.keys(PATH_GLOB_TO_TYPE_MAP), {
    cwd: wxt.config.entrypointsDir,
  });
  // Ensure consistent output
  relativePaths.sort();

  const pathGlobs = Object.keys(PATH_GLOB_TO_TYPE_MAP);
  const entrypointInfos: EntrypointInfo[] = relativePaths
    .reduce<EntrypointInfo[]>((results, relativePath) => {
      const inputPath = resolve(wxt.config.entrypointsDir, relativePath);
      const name = getEntrypointName(wxt.config.entrypointsDir, inputPath);
      const matchingGlob = pathGlobs.find((glob) =>
        minimatch(relativePath, glob),
      );
      if (matchingGlob) {
        const type = PATH_GLOB_TO_TYPE_MAP[matchingGlob];
        results.push({ name, inputPath, type });
      }
      return results;
    }, [])
    .filter(({ name, inputPath }, _, entrypointInfos) => {
      // Remove <name>/index.* if <name>/index.html exists

      if (inputPath.endsWith('.html')) return true;
      const isIndexFile = /index\..+$/.test(inputPath);
      if (!isIndexFile) return true;

      const hasIndexHtml = entrypointInfos.some(
        (entry) =>
          entry.name === name && entry.inputPath.endsWith('index.html'),
      );
      if (hasIndexHtml) return false;

      return true;
    });

  await wxt.hooks.callHook('entrypoints:found', wxt, entrypointInfos);

  // Validation
  preventNoEntrypoints(entrypointInfos);
  preventDuplicateEntrypointNames(entrypointInfos);

  // Import entrypoints to get their config
  let hasBackground = false;
  const entrypointOptions = await importEntrypoints(entrypointInfos);
  const entrypointsWithoutSkipped: Entrypoint[] = await Promise.all(
    entrypointInfos.map(async (info): Promise<Entrypoint> => {
      const { type } = info;
      const options = entrypointOptions[info.inputPath] ?? {};
      switch (type) {
        case 'popup':
          return await getPopupEntrypoint(info, options);
        case 'sidepanel':
          return await getSidepanelEntrypoint(info, options);
        case 'options':
          return await getOptionsEntrypoint(info, options);
        case 'background':
          hasBackground = true;
          return await getBackgroundEntrypoint(info, options);
        case 'content-script':
          return await getContentScriptEntrypoint(info, options);
        case 'unlisted-page':
          return await getUnlistedPageEntrypoint(info, options);
        case 'unlisted-script':
          return await getUnlistedScriptEntrypoint(info, options);
        case 'content-script-style':
          return {
            ...info,
            type,
            outputDir: resolve(wxt.config.outDir, CONTENT_SCRIPT_OUT_DIR),
            options: {
              include: options.include,
              exclude: options.exclude,
            },
          };
        default:
          return {
            ...info,
            type,
            outputDir: wxt.config.outDir,
            options: {
              include: options.include,
              exclude: options.exclude,
            },
          };
      }
    }),
  );

  if (wxt.config.command === 'serve' && !hasBackground) {
    entrypointsWithoutSkipped.push(
      await getBackgroundEntrypoint(
        {
          inputPath: VIRTUAL_NOOP_BACKGROUND_MODULE_ID,
          name: 'background',
          type: 'background',
        },
        {},
      ),
    );
  }

  // Mark entrypoints as skipped or not
  const entrypoints = entrypointsWithoutSkipped.map((entry) => ({
    ...entry,
    skipped: isEntrypointSkipped(entry),
  }));

  await wxt.hooks.callHook('entrypoints:resolved', wxt, entrypoints);

  wxt.logger.debug('All entrypoints:', entrypoints);
  const skippedEntrypointNames = entrypoints
    .filter((item) => item.skipped)
    .map((item) => item.name);
  if (skippedEntrypointNames.length) {
    wxt.logger.warn(
      [
        'The following entrypoints have been skipped:',
        ...skippedEntrypointNames.map(
          (item) => `${pc.dim('-')} ${pc.cyan(item)}`,
        ),
      ].join('\n'),
    );
  }

  return entrypoints;
}

/** Returns a map of input paths to the file's options. */
async function importEntrypoints(infos: EntrypointInfo[]) {
  const resMap: Record<string, Record<string, any> | undefined> = {};

  const htmlInfos = infos.filter((info) => isHtmlEntrypoint(info));
  const jsInfos = infos.filter((info) => isJsEntrypoint(info));

  await Promise.all([
    // HTML
    ...htmlInfos.map(async (info) => {
      const res = await importHtmlEntrypoint(info);
      resMap[info.inputPath] = res;
    }),
    // JS
    (async () => {
      const res = await wxt.builder.importEntrypoints(
        jsInfos.map((info) => info.inputPath),
      );
      res.forEach((res, i) => {
        resMap[jsInfos[i].inputPath] = res;
      });
    })(),
    // CSS - never has options
  ]);

  return resMap;
}

/** Extract `manifest.` options from meta tags, converting snake_case keys to camelCase */
async function importHtmlEntrypoint(
  info: EntrypointInfo,
): Promise<Record<string, any>> {
  const content = await fs.readFile(info.inputPath, 'utf-8');
  const { document } = parseHTML(content);

  const metaTags = document.querySelectorAll('meta');
  const res: Record<string, any> = {
    title: document.querySelector('title')?.textContent || undefined,
  };

  metaTags.forEach((tag) => {
    const name = tag.name;
    if (!name.startsWith('manifest.')) return;

    const key = camelCase(name.slice(9));
    try {
      res[key] = JSON5.parse(tag.content);
    } catch {
      res[key] = tag.content;
    }
  });

  return res;
}

function preventDuplicateEntrypointNames(files: EntrypointInfo[]) {
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
          lines.push(`  - ${relative(wxt.config.root, absolutePath)}`);
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

function preventNoEntrypoints(files: EntrypointInfo[]) {
  if (files.length === 0) {
    throw Error(`No entrypoints found in ${wxt.config.entrypointsDir}`);
  }
}

async function getPopupEntrypoint(
  info: EntrypointInfo,
  options: Record<string, any>,
): Promise<PopupEntrypoint> {
  const stictOptions: PopupEntrypoint['options'] = resolvePerBrowserOptions(
    {
      browserStyle: options.browserStyle,
      exclude: options.exclude,
      include: options.include,
      defaultIcon: options.defaultIcon,
      defaultTitle: options.title,
      mv2Key: options.type,
    },
    wxt.config.browser,
  );
  if (stictOptions.mv2Key && stictOptions.mv2Key !== 'page_action')
    stictOptions.mv2Key = 'browser_action';

  return {
    type: 'popup',
    name: 'popup',
    options: stictOptions,
    inputPath: info.inputPath,
    outputDir: wxt.config.outDir,
  };
}

async function getOptionsEntrypoint(
  info: EntrypointInfo,
  options: Record<string, any>,
): Promise<OptionsEntrypoint> {
  return {
    type: 'options',
    name: 'options',
    options: resolvePerBrowserOptions(
      {
        browserStyle: options.browserStyle,
        chromeStyle: options.chromeStyle,
        exclude: options.exclude,
        include: options.include,
        openInTab: options.openInTab,
      },
      wxt.config.browser,
    ),
    inputPath: info.inputPath,
    outputDir: wxt.config.outDir,
  };
}

async function getUnlistedPageEntrypoint(
  info: EntrypointInfo,
  options: Record<string, any>,
): Promise<GenericEntrypoint> {
  return {
    type: 'unlisted-page',
    name: info.name,
    inputPath: info.inputPath,
    outputDir: wxt.config.outDir,
    options: {
      include: options.include,
      exclude: options.exclude,
    },
  };
}

async function getUnlistedScriptEntrypoint(
  { inputPath, name }: EntrypointInfo,
  options: Record<string, any>,
): Promise<GenericEntrypoint> {
  return {
    type: 'unlisted-script',
    name,
    inputPath,
    outputDir: wxt.config.outDir,
    options: resolvePerBrowserOptions(
      {
        include: options.include,
        exclude: options.exclude,
      },
      wxt.config.browser,
    ),
  };
}

async function getBackgroundEntrypoint(
  { inputPath, name }: EntrypointInfo,
  options: Record<string, any>,
): Promise<BackgroundEntrypoint> {
  const strictOptions: BackgroundEntrypoint['options'] =
    resolvePerBrowserOptions(
      {
        include: options.include,
        exclude: options.exclude,
        persistent: options.persistent,
        type: options.type,
      },
      wxt.config.browser,
    );

  if (wxt.config.manifestVersion !== 3) {
    delete strictOptions.type;
  }

  return {
    type: 'background',
    name,
    inputPath,
    outputDir: wxt.config.outDir,
    options: strictOptions,
  };
}

async function getContentScriptEntrypoint(
  { inputPath, name }: EntrypointInfo,
  options: Record<string, any>,
): Promise<ContentScriptEntrypoint> {
  return {
    type: 'content-script',
    name,
    inputPath,
    outputDir: resolve(wxt.config.outDir, CONTENT_SCRIPT_OUT_DIR),
    options: resolvePerBrowserOptions(
      options as
        | MainWorldContentScriptEntrypointOptions
        | IsolatedWorldContentScriptEntrypointOptions,
      wxt.config.browser,
    ),
  };
}

async function getSidepanelEntrypoint(
  info: EntrypointInfo,
  options: Record<string, any>,
): Promise<SidepanelEntrypoint> {
  return {
    type: 'sidepanel',
    name: info.name,
    options: resolvePerBrowserOptions(
      {
        browserStyle: options.browserStyle,
        exclude: options.exclude,
        include: options.include,
        defaultIcon: options.defaultIcon,
        defaultTitle: options.title,
        openAtInstall: options.openAtInstall,
      },
      wxt.config.browser,
    ),
    inputPath: info.inputPath,
    outputDir: wxt.config.outDir,
  };
}

function isEntrypointSkipped(entry: Omit<Entrypoint, 'skipped'>): boolean {
  if (wxt.config.filterEntrypoints != null) {
    return !wxt.config.filterEntrypoints.has(entry.name);
  }

  const { include, exclude } = entry.options;
  if (include?.length && exclude?.length) {
    wxt.logger.warn(
      `The ${entry.name} entrypoint lists both include and exclude, but only one can be used per entrypoint. Entrypoint skipped.`,
    );
    return true;
  }

  if (exclude?.length && !include?.length) {
    return exclude.includes(wxt.config.browser);
  }
  if (include?.length && !exclude?.length) {
    return !include.includes(wxt.config.browser);
  }

  return false;
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
