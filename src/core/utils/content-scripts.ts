import type { Manifest } from 'webextension-polyfill';
import { ContentScriptEntrypoint, InternalConfig } from '~/types';
import { resolvePerBrowserOption } from './entrypoints';

/**
 * Returns a unique and consistent string hash based on a content scripts options.
 *
 * It is able to recognize default values,
 */
export function hashContentScriptOptions(
  options: ContentScriptEntrypoint['options'],
  config: InternalConfig,
): string {
  const simplifiedOptions = mapWxtOptionsToContentScript(options, config);

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
  config: InternalConfig,
): Omit<Manifest.ContentScript, 'js' | 'css'> {
  return {
    matches: resolvePerBrowserOption(options.matches, config.browser),
    all_frames: resolvePerBrowserOption(options.allFrames, config.browser),
    match_about_blank: resolvePerBrowserOption(
      options.matchAboutBlank,
      config.browser,
    ),
    exclude_globs: resolvePerBrowserOption(
      options.excludeGlobs,
      config.browser,
    ),
    exclude_matches: resolvePerBrowserOption(
      options.excludeMatches,
      config.browser,
    ),
    include_globs: resolvePerBrowserOption(
      options.includeGlobs,
      config.browser,
    ),
    run_at: resolvePerBrowserOption(options.runAt, config.browser),

    // @ts-expect-error: untyped chrome options
    match_origin_as_fallback: resolvePerBrowserOption(
      options.matchOriginAsFallback,
      config.browser,
    ),
    world: options.world,
  };
}
