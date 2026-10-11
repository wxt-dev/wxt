import type {
  Entrypoint,
  EntrypointFinder,
  EntrypointInfo,
  ResolvedConfig,
} from '../../types';
import { VIRTUAL_NOOP_BACKGROUND_MODULE_ID } from '../constants';
import { CSS_EXTENSIONS_PATTERN } from '../../internal-utils/path-utils';
import picomatch from 'picomatch';
import { glob } from 'tinyglobby';
import { getEntrypointName } from '../../internal-utils/entrypoint-utils';
import { resolve } from 'node:path';

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

/**
 * WXT's default entrypoint finder. It looks up entrypoints using a flat folder
 * structure inside the `entrypoints.` directory, as described in the docs:
 * https://wxt.dev/guide/essentials/entrypoints.html
 */
export class FlatEntrypointFinder implements EntrypointFinder {
  constructor(public config: ResolvedConfig) {}

  async findEntrypoints(): Promise<EntrypointInfo[]> {
    const relativePaths = await glob(Object.keys(PATH_GLOB_TO_TYPE_MAP), {
      cwd: this.config.entrypointsDir,
      expandDirectories: false,
    });
    // Ensure consistent output
    relativePaths.sort();

    const pathGlobs = Object.keys(PATH_GLOB_TO_TYPE_MAP);
    return relativePaths
      .reduce<EntrypointInfo[]>((results, relativePath) => {
        const inputPath = resolve(this.config.entrypointsDir, relativePath);
        const name = getEntrypointName(this.config.entrypointsDir, inputPath);
        const matchingGlob = pathGlobs.find((glob) =>
          picomatch(glob)(relativePath),
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

        return !hasIndexHtml;
      });
  }
}
