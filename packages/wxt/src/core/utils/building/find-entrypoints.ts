import { relative, resolve } from 'path';
import {
  BackgroundEntrypoint,
  BackgroundDefinition,
  BaseEntrypointOptions,
  ContentScriptDefinition,
  ContentScriptEntrypoint,
  Entrypoint,
  GenericEntrypoint,
  OptionsEntrypoint,
  PopupEntrypoint,
  UnlistedScriptDefinition,
  PopupEntrypointOptions,
  OptionsEntrypointOptions,
  SidepanelEntrypoint,
  SidepanelEntrypointOptions,
} from '~/types';
import fs from 'fs-extra';
import { minimatch } from 'minimatch';
import { parseHTML } from 'linkedom';
import JSON5 from 'json5';
import glob from 'fast-glob';
import {
  getEntrypointName,
  resolvePerBrowserOptions,
} from '~/core/utils/entrypoints';
import { VIRTUAL_NOOP_BACKGROUND_MODULE_ID } from '~/core/utils/constants';
import { CSS_EXTENSIONS_PATTERN } from '~/core/utils/paths';
import pc from 'picocolors';
import { wxt } from '../../wxt';

/**
 * Return entrypoints and their configuration by looking through the project's files.
 */
export async function findEntrypoints(): Promise<Entrypoint[]> {
  const relativePaths = await glob(Object.keys(PATH_GLOB_TO_TYPE_MAP), {
    cwd: wxt.config.entrypointsDir,
  });
  // Ensure consistent output
  relativePaths.sort();

  const pathGlobs = Object.keys(PATH_GLOB_TO_TYPE_MAP);
  const entrypointInfos: EntrypointInfo[] = relativePaths.reduce<
    EntrypointInfo[]
  >((results, relativePath) => {
    const inputPath = resolve(wxt.config.entrypointsDir, relativePath);
    const name = getEntrypointName(wxt.config.entrypointsDir, inputPath);
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
          wxt.config.filterEntrypoints != null &&
          !wxt.config.filterEntrypoints.has(name),
      });
    }
    return results;
  }, []);

  // Validation
  preventNoEntrypoints(entrypointInfos);
  preventDuplicateEntrypointNames(entrypointInfos);

  // Import entrypoints to get their config
  const runtime = await wxt.builder.createRuntime();
  let hasBackground = false;
  const entrypoints: Entrypoint[] = [];

  const doit = async (info: EntrypointInfo) => {
    const importDefinition = async () => {
      try {
        const { default: definition } = await runtime.importFile<{
          default: any;
        }>(info.inputPath);
        return definition;
      } catch (err) {
        console.error(info, err.message);
        throw err;
      }
    };
    const { type } = info;
    switch (type) {
      case 'popup':
        return await getPopupEntrypoint(info);
      case 'sidepanel':
        return await getSidepanelEntrypoint(info);
      case 'options':
        return await getOptionsEntrypoint(info);
      case 'background':
        hasBackground = true;
        return await getBackgroundEntrypoint(await importDefinition(), info);
      case 'content-script':
        return await getContentScriptEntrypoint(await importDefinition(), info);
      case 'unlisted-page':
        return await getUnlistedPageEntrypoint(info);
      case 'unlisted-script':
        return await getUnlistedScriptEntrypoint(
          await importDefinition(),
          info,
        );
      case 'content-script-style':
        return {
          ...info,
          type,
          outputDir: resolve(wxt.config.outDir, CONTENT_SCRIPT_OUT_DIR),
          options: {
            include: undefined,
            exclude: undefined,
          },
        };
      default:
        return {
          ...info,
          type,
          outputDir: wxt.config.outDir,
          options: {
            include: undefined,
            exclude: undefined,
          },
        };
    }
  };

  for (const info of entrypointInfos) {
    entrypoints.push(await doit(info));
  }

  if (wxt.config.command === 'serve' && !hasBackground) {
    entrypoints.push({
      type: 'background',
      inputPath: VIRTUAL_NOOP_BACKGROUND_MODULE_ID,
      name: 'background',
      outputDir: wxt.config.outDir,
      skipped: false,
      options: {},
    });
  }

  wxt.logger.debug('All entrypoints:', entrypoints);
  const skippedEntrypointNames = entrypointInfos
    .filter((item) => item.skipped)
    .map((item) => item.name);
  if (skippedEntrypointNames.length) {
    wxt.logger.warn(
      `Filter excluded the following entrypoints:\n${skippedEntrypointNames
        .map((item) => `${pc.dim('-')} ${pc.cyan(item)}`)
        .join('\n')}`,
    );
  }
  const targetEntrypoints = entrypoints.filter((entry) => {
    const { include, exclude } = entry.options;
    if (include?.length && exclude?.length) {
      wxt.logger.warn(
        `The ${entry.name} entrypoint lists both include and exclude, but only one can be used per entrypoint. Entrypoint ignored.`,
      );
      return false;
    }
    if (exclude?.length && !include?.length) {
      return !exclude.includes(wxt.config.browser);
    }
    if (include?.length && !exclude?.length) {
      return include.includes(wxt.config.browser);
    }
    if (skippedEntrypointNames.includes(entry.name)) {
      return false;
    }

    return true;
  });
  wxt.logger.debug(`${wxt.config.browser} entrypoints:`, targetEntrypoints);
  await wxt.hooks.callHook('entrypoints:resolved', wxt, targetEntrypoints);

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
): Promise<PopupEntrypoint> {
  const options = await getHtmlEntrypointOptions<PopupEntrypointOptions>(
    info,
    {
      browserStyle: 'browse_style',
      exclude: 'exclude',
      include: 'include',
      defaultIcon: 'default_icon',
      defaultTitle: 'default_title',
      mv2Key: 'type',
    },
    {
      defaultTitle: (document) =>
        document.querySelector('title')?.textContent || undefined,
    },
    {
      defaultTitle: (content) => content,
      mv2Key: (content) =>
        content === 'page_action' ? 'page_action' : 'browser_action',
    },
  );

  return {
    type: 'popup',
    name: 'popup',
    options: resolvePerBrowserOptions(options, wxt.config.browser),
    inputPath: info.inputPath,
    outputDir: wxt.config.outDir,
    skipped: info.skipped,
  };
}

async function getOptionsEntrypoint(
  info: EntrypointInfo,
): Promise<OptionsEntrypoint> {
  const options = await getHtmlEntrypointOptions<OptionsEntrypointOptions>(
    info,
    {
      browserStyle: 'browse_style',
      chromeStyle: 'chrome_style',
      exclude: 'exclude',
      include: 'include',
      openInTab: 'open_in_tab',
    },
  );
  return {
    type: 'options',
    name: 'options',
    options: resolvePerBrowserOptions(options, wxt.config.browser),
    inputPath: info.inputPath,
    outputDir: wxt.config.outDir,
    skipped: info.skipped,
  };
}

async function getUnlistedPageEntrypoint(
  info: EntrypointInfo,
): Promise<GenericEntrypoint> {
  const options = await getHtmlEntrypointOptions<BaseEntrypointOptions>(info, {
    exclude: 'exclude',
    include: 'include',
  });

  return {
    type: 'unlisted-page',
    name: info.name,
    inputPath: info.inputPath,
    outputDir: wxt.config.outDir,
    options,
    skipped: info.skipped,
  };
}

async function getUnlistedScriptEntrypoint(
  definition: UnlistedScriptDefinition,
  { inputPath, name, skipped }: EntrypointInfo,
): Promise<GenericEntrypoint> {
  if (definition == null) {
    throw Error(
      `${name}: Default export not found, did you forget to call "export default defineUnlistedScript(...)"?`,
    );
  }
  const { main: _, ...options } = definition;
  return {
    type: 'unlisted-script',
    name,
    inputPath,
    outputDir: wxt.config.outDir,
    options: resolvePerBrowserOptions(options, wxt.config.browser),
    skipped,
  };
}

async function getBackgroundEntrypoint(
  definition: BackgroundDefinition,
  { inputPath, name, skipped }: EntrypointInfo,
): Promise<BackgroundEntrypoint> {
  if (definition == null) {
    throw Error(
      `${name}: Default export not found, did you forget to call "export default defineBackground(...)"?`,
    );
  }
  const { main: _, ...options } = definition;

  if (wxt.config.manifestVersion !== 3) {
    delete options.type;
  }

  return {
    type: 'background',
    name,
    inputPath,
    outputDir: wxt.config.outDir,
    options: resolvePerBrowserOptions(options, wxt.config.browser),
    skipped,
  };
}

async function getContentScriptEntrypoint(
  definition: ContentScriptDefinition,
  { inputPath, name, skipped }: EntrypointInfo,
): Promise<ContentScriptEntrypoint> {
  const { main: _, ...options } = definition;
  if (options == null) {
    throw Error(
      `${name}: Default export not found, did you forget to call "export default defineContentScript(...)"?`,
    );
  }
  return {
    type: 'content-script',
    name,
    inputPath,
    outputDir: resolve(wxt.config.outDir, CONTENT_SCRIPT_OUT_DIR),
    options: resolvePerBrowserOptions(options, wxt.config.browser),
    skipped,
  };
}

async function getSidepanelEntrypoint(
  info: EntrypointInfo,
): Promise<SidepanelEntrypoint> {
  const options = await getHtmlEntrypointOptions<SidepanelEntrypointOptions>(
    info,
    {
      browserStyle: 'browse_style',
      exclude: 'exclude',
      include: 'include',
      defaultIcon: 'default_icon',
      defaultTitle: 'default_title',
      openAtInstall: 'open_at_install',
    },
    {
      defaultTitle: (document) =>
        document.querySelector('title')?.textContent || undefined,
    },
    {
      defaultTitle: (content) => content,
    },
  );

  return {
    type: 'sidepanel',
    name: info.name,
    options: resolvePerBrowserOptions(options, wxt.config.browser),
    inputPath: info.inputPath,
    outputDir: wxt.config.outDir,
    skipped: info.skipped,
  };
}

/**
 * Parse the HTML tags to extract options from them.
 */
async function getHtmlEntrypointOptions<T extends BaseEntrypointOptions>(
  info: EntrypointInfo,
  keyMap: Record<keyof T, string>,
  queries?: Partial<{
    [key in keyof T]: (
      document: Document,
      manifestKey: string,
    ) => string | undefined;
  }>,
  parsers?: Partial<{ [key in keyof T]: (content: string) => T[key] }>,
): Promise<T> {
  const content = await fs.readFile(info.inputPath, 'utf-8');
  const { document } = parseHTML(content);

  const options = {} as T;

  const defaultQuery = (manifestKey: string) =>
    document
      .querySelector(`meta[name='manifest.${manifestKey}']`)
      ?.getAttribute('content');

  Object.entries(keyMap).forEach(([_key, manifestKey]) => {
    const key = _key as keyof T;
    const content = queries?.[key]
      ? queries[key]!(document, manifestKey)
      : defaultQuery(manifestKey);
    if (content) {
      try {
        options[key] = (parsers?.[key] ?? JSON5.parse)(content);
      } catch (err) {
        wxt.logger.fatal(
          `Failed to parse meta tag content. Usually this means you have invalid JSON5 content (content=${content})`,
          err,
        );
      }
    }
  });

  return options;
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
