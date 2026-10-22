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
  UnlistedScriptEntrypoint,
} from '../types';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parseHTML } from 'linkedom';
import JSON5 from 'json5';
import {
  isHtmlEntrypoint,
  isJsEntrypoint,
  resolvePerBrowserOptions,
} from '../internal-utils/entrypoint-utils';
import { VIRTUAL_NOOP_BACKGROUND_MODULE_ID } from './constants';
import { wxt } from './wxt';
import { camelCase } from 'scule';
import { styleText } from 'node:util';

/**
 * Return entrypoints and their configuration by looking through the project's
 * files.
 */
export async function findEntrypoints(): Promise<Entrypoint[]> {
  // Make sure required TSConfig file exists to load dependencies
  await mkdir(wxt.config.wxtDir, { recursive: true });
  try {
    await writeFile(
      resolve(wxt.config.wxtDir, 'tsconfig.json'),
      JSON.stringify({}),
      { flag: 'wx' },
    );
  } catch (err) {
    if (!(err instanceof Error) || !('code' in err) || err.code !== 'EEXIST') {
      throw err;
    }
  }

  const entrypointInfos = await wxt.entrypointFinder.findEntrypoints();
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
            options,
          };
        default:
          return {
            ...info,
            type,
            outputDir: wxt.config.outDir,
            options,
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
          (item) => `${styleText('dim', '-')} ${styleText('cyan', item)}`,
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
      resMap[info.inputPath] = await importHtmlEntrypoint(info);
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

/**
 * Extract `manifest.` and `wxt.` options from meta tags, converting snake_case
 * keys to camelCase
 */
async function importHtmlEntrypoint(
  info: EntrypointInfo,
): Promise<Record<string, any>> {
  const content = await readFile(info.inputPath, 'utf-8');
  const { document } = parseHTML(content);

  const metaTags = document.querySelectorAll('meta');
  const res: Record<string, any> = {
    title: document.querySelector('title')?.textContent || undefined,
  };

  metaTags.forEach((tag) => {
    const name = tag.name;
    let key: string;

    if (name.startsWith('manifest.')) {
      key = camelCase(name.slice(9));
    } else if (name.startsWith('wxt.')) {
      key = camelCase(name.slice(4));
    } else {
      return;
    }

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
  // Extract non-per-browser options
  const { themeIcons, title, type, ...perBrowserOptions } = options;

  const strictOptions: PopupEntrypoint['options'] = resolvePerBrowserOptions(
    {
      ...perBrowserOptions,
      defaultTitle: title,
      actionType: type,
    },
    wxt.config.browser,
  );
  if (strictOptions.actionType && strictOptions.actionType !== 'page_action')
    strictOptions.actionType = 'browser_action';

  // Sync deprecated `mv2Key` with `actionType` via getter/setter so modules
  // that read or write either property stay in sync.
  const opts = { ...strictOptions, themeIcons } as PopupEntrypoint['options'];
  let _actionType = opts.actionType;
  Object.defineProperty(opts, 'actionType', {
    get: () => _actionType,
    set: (v: typeof _actionType) => (_actionType = v),
    enumerable: true,
    configurable: true,
  });
  Object.defineProperty(opts, 'mv2Key', {
    get: () => _actionType,
    set: (v: typeof _actionType) => (_actionType = v),
    enumerable: true,
    configurable: true,
  });

  return {
    type: 'popup',
    name: 'popup',
    options: opts,
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
    options: resolvePerBrowserOptions(options, wxt.config.browser),
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
    options,
  };
}

async function getUnlistedScriptEntrypoint(
  { inputPath, name }: EntrypointInfo,
  options: Record<string, any>,
): Promise<UnlistedScriptEntrypoint> {
  return {
    type: 'unlisted-script',
    name,
    inputPath,
    outputDir: wxt.config.outDir,
    options: resolvePerBrowserOptions(options, wxt.config.browser),
  };
}

async function getBackgroundEntrypoint(
  { inputPath, name }: EntrypointInfo,
  options: Record<string, any>,
): Promise<BackgroundEntrypoint> {
  const strictOptions: BackgroundEntrypoint['options'] =
    resolvePerBrowserOptions(options, wxt.config.browser);

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
  // Extract non-per-browser options and rename title to defaultTitle
  const { title, ...perBrowserOptions } = options;

  return {
    type: 'sidepanel',
    name: info.name,
    options: resolvePerBrowserOptions(
      {
        ...perBrowserOptions,
        defaultTitle: title,
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

const CONTENT_SCRIPT_OUT_DIR = 'content-scripts';
