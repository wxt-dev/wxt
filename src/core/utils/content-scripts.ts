import { Manifest } from 'webextension-polyfill';
import { ContentScriptEntrypoint } from '../types';

/**
 * Returns a unique and consistent string hash based on a content scripts options.
 *
 * It is able to recognize default values,
 */
export function hashContentScriptOptions(
  options: ContentScriptEntrypoint['options'],
): string {
  const withDefaults: ContentScriptEntrypoint['options'] = {
    excludeGlobs: [],
    excludeMatches: [],
    includeGlobs: [],
    matchAboutBlank: false,
    matchOriginAsFallback: false,
    runAt: 'document_idle',
    allFrames: false,
    world: 'ISOLATED',
    // TODO: strip undefined fields from options object to improve content script grouping.
    ...options,
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

export function mapWxtOptionsToContentScript(
  options: ContentScriptEntrypoint['options'],
): Omit<Manifest.ContentScript, 'js' | 'css'> {
  return {
    matches: options.matches,
    all_frames: options.allFrames,
    match_about_blank: options.matchAboutBlank,
    exclude_globs: options.excludeGlobs,
    exclude_matches: options.excludeMatches,
    include_globs: options.includeGlobs,
    run_at: options.runAt,

    // @ts-expect-error: untyped chrome options
    match_origin_as_fallback: options.matchOriginAsFallback,
    world: options.world,
  };
}
