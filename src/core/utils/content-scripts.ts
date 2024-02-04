import type { Manifest } from '~/browser';
import { ContentScriptEntrypoint } from '~/types';
import { resolvePerBrowserOption } from './entrypoints';
import { wxt } from './wxt';

/**
 * Returns a unique and consistent string hash based on a content scripts options.
 *
 * It is able to recognize default values,
 */
export function hashContentScriptOptions(
  options: ContentScriptEntrypoint['options'],
): string {
  const simplifiedOptions = mapWxtOptionsToContentScript(options);

  // Remove undefined fields and use defaults to generate hash
  Object.keys(simplifiedOptions).forEach((key) => {
    // @ts-expect-error: key not typed as keyof ...
    if (simplifiedOptions[key] == null) delete simplifiedOptions[key];
  });

  const withDefaults: Manifest.ContentScript = {
    exclude_globs: [],
    exclude_matches: [],
    include_globs: [],
    match_about_blank: false,
    run_at: 'document_idle',
    all_frames: false,
    // @ts-expect-error - not in type
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

export function mapWxtOptionsToContentScript(
  options: ContentScriptEntrypoint['options'],
): Omit<Manifest.ContentScript, 'js' | 'css'> {
  return {
    matches: resolvePerBrowserOption(options.matches, wxt.config.browser),
    all_frames: resolvePerBrowserOption(options.allFrames, wxt.config.browser),
    match_about_blank: resolvePerBrowserOption(
      options.matchAboutBlank,
      wxt.config.browser,
    ),
    exclude_globs: resolvePerBrowserOption(
      options.excludeGlobs,
      wxt.config.browser,
    ),
    exclude_matches: resolvePerBrowserOption(
      options.excludeMatches,
      wxt.config.browser,
    ),
    include_globs: resolvePerBrowserOption(
      options.includeGlobs,
      wxt.config.browser,
    ),
    run_at: resolvePerBrowserOption(options.runAt, wxt.config.browser),

    // @ts-expect-error: untyped chrome options
    match_origin_as_fallback: resolvePerBrowserOption(
      options.matchOriginAsFallback,
      wxt.config.browser,
    ),
    world: options.world,
  };
}
