import type { Browser } from '@wxt-dev/browser';
import { ContentScriptEntrypoint, ResolvedConfig } from '../../types';
import { getEntrypointBundlePath } from './entrypoints';
import { ManifestContentScript } from './types';

/**
 * Returns a unique and consistent string hash based on a content scripts
 * options.
 *
 * It is able to recognize default values,
 */
export function hashContentScriptOptions(
  options: ContentScriptEntrypoint['options'],
): string {
  const simplifiedOptions = mapWxtOptionsToContentScript(
    options,
    undefined,
    undefined,
  );

  // Remove undefined fields and use defaults to generate hash
  Object.keys(simplifiedOptions).forEach((key) => {
    // @ts-expect-error: key not typed as keyof ...
    if (simplifiedOptions[key] == null) delete simplifiedOptions[key];
  });

  const withDefaults: ManifestContentScript = {
    exclude_globs: [],
    exclude_matches: [],
    include_globs: [],
    match_about_blank: false,
    run_at: 'document_idle',
    all_frames: false,
    match_origin_as_fallback: false,
    world: 'ISOLATED',
    ...simplifiedOptions,
  };
  return JSON.stringify(
    Object.entries(withDefaults)
      // Sort any arrays so their values are consistent
      .map<[string, unknown]>(([key, value]) => {
        if (Array.isArray(value)) return [key, value.sort()];
        else return [key, value];
      })
      // Sort all the fields alphabetically
      .sort((l, r) => l[0].localeCompare(r[0])),
  );
}

/**
 * - "<all_urls>" → "<all_urls>"
 * - "_://play.google.com/books/_" → "_://play.google.com/_"
 */
export function stripPathFromMatchPattern(pattern: string) {
  const protocolSepIndex = pattern.indexOf('://');
  if (protocolSepIndex === -1) return pattern;

  const startOfPath = pattern.indexOf('/', protocolSepIndex + 3);
  return pattern.substring(0, startOfPath) + '/*';
}

/** Returns true when the content script opted into SPA support. */
export function isSpaContentScript(
  options: ContentScriptEntrypoint['options'],
): boolean {
  return !!options.spa;
}

/**
 * The match patterns the browser registers the content script against. For SPA
 * scripts the path is stripped, so the script loads once for the whole origin
 * and the SPA handler re-checks the real patterns at runtime.
 */
export function getRegisteredMatches(
  options: ContentScriptEntrypoint['options'],
): string[] | undefined {
  const matches = options.matches;
  if (matches == null || !isSpaContentScript(options)) return matches;
  return Array.from(new Set(matches.map(stripPathFromMatchPattern)));
}

/**
 * The browser applies `exclude_matches` when the document loads, so a
 * path-scoped exclusion would stop an SPA script loading on pages the user can
 * navigate to. Applied at runtime instead.
 */
function getRegisteredExcludeMatches(
  options: ContentScriptEntrypoint['options'],
): string[] | undefined {
  return isSpaContentScript(options) ? undefined : options.excludeMatches;
}

export function mapWxtOptionsToContentScript(
  options: ContentScriptEntrypoint['options'],
  js: string[] | undefined,
  css: string[] | undefined,
): ManifestContentScript {
  return {
    matches: getRegisteredMatches(options) ?? [],
    all_frames: options.allFrames,
    match_about_blank: options.matchAboutBlank,
    exclude_globs: options.excludeGlobs,
    exclude_matches: getRegisteredExcludeMatches(options),
    include_globs: options.includeGlobs,
    run_at: options.runAt,
    css,
    js,
    match_origin_as_fallback: options.matchOriginAsFallback,
    world: options.world,
  };
}

export function mapWxtOptionsToRegisteredContentScript(
  options: ContentScriptEntrypoint['options'],
  js: string[] | undefined,
  css: string[] | undefined,
): Omit<Browser.scripting.RegisteredContentScript, 'id'> {
  return {
    allFrames: options.allFrames,
    excludeMatches: getRegisteredExcludeMatches(options),
    matches: getRegisteredMatches(options),
    runAt: options.runAt,
    js,
    css,
    world: options.world,
  };
}

export function getContentScriptJs(
  config: ResolvedConfig,
  entrypoint: ContentScriptEntrypoint,
): string[] {
  return [getEntrypointBundlePath(entrypoint, config.outDir, '.js')];
}
