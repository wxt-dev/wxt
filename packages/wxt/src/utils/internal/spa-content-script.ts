import { MatchPattern } from 'wxt/utils/match-patterns';
import type { ContentScriptContext } from '../content-script-context';
import type { PerBrowserOption, SpaContentScriptOptions } from '../../types';
import { logger } from './logger';

/**
 * Declared structurally because the virtual entrypoint imports the class from
 * `wxt/utils/content-script-context`, which TS treats as a different type than
 * this file's relative import.
 */
export type SpaParentContext = Pick<
  ContentScriptContext,
  'onInvalidated' | 'addEventListener'
>;

/** The options the SPA handler reads. Structural, see {@link SpaParentContext}. */
export interface SpaContentScriptDefinition {
  matches?: PerBrowserOption<string[]>;
  excludeMatches?: PerBrowserOption<string[] | undefined>;
  spa?: boolean | SpaContentScriptOptions;
  noScriptStartedPostMessage?: boolean;
  main(ctx: any): any;
}

/** Default `spa.key`. Everything but the hash, so anchors don't remount. */
export function getDefaultSpaKey(url: URL): string {
  return url.origin + url.pathname + url.search;
}

/**
 * Runs `main` once per matching "page" of a single page application, creating a
 * child context for each one and aborting it when navigating away. The script
 * is registered against the origin of its `matches` (see
 * `getRegisteredMatches`), so this re-checks the real patterns on every URL
 * change.
 *
 * Returns the first `main` call's result, so `executeScript` still reports a
 * value.
 */
export async function runSpaContentScript(
  parentCtx: SpaParentContext,
  definition: SpaContentScriptDefinition,
  contentScriptName: string,
): Promise<unknown> {
  const { main, ...options } = definition;
  const matches = toMatchPatterns(definition.matches, 'matches');
  if (matches == null || matches.length === 0) {
    throw Error(
      `Content script "${contentScriptName}" sets \`spa: true\`, which requires at least one match pattern`,
    );
  }
  const excludeMatches =
    toMatchPatterns(definition.excludeMatches, 'excludeMatches') ?? [];

  const spa: SpaContentScriptOptions =
    typeof definition.spa === 'object' ? definition.spa : {};
  const getKey = spa.key ?? getDefaultSpaKey;

  // Distinct name, otherwise the child would invalidate `parentCtx` - they
  // share the `wxt:content-script-started` channel.
  const childName = `${contentScriptName}:spa`;
  const childOptions = {
    ...options,
    // Only needed for backwards compatibility, and nothing predates child
    // contexts.
    noScriptStartedPostMessage: true,
  };

  // Importing the class as a value would duplicate it in the bundle.
  const Context = parentCtx.constructor as typeof ContentScriptContext;

  let childCtx: ContentScriptContext | undefined;
  let childKey: string | undefined;

  const stop = (reason: string) => {
    if (childCtx == null) return;
    debug(reason);
    childCtx.abort(reason);
    childCtx = undefined;
    childKey = undefined;
  };

  const isMatch = (url: URL) =>
    matches.some((pattern) => pattern.includes(url)) &&
    !excludeMatches.some((pattern) => pattern.includes(url));

  const run = async (url: URL): Promise<unknown> => {
    if (!isMatch(url)) {
      stop(`SPA navigated to a non-matching URL: ${url.href}`);
      return;
    }

    const nextKey = getKey(url);
    if (childCtx != null && childKey === nextKey) {
      // Same page, leave the running context alone instead of remounting.
      debug(`SPA navigated within the same page ("${nextKey}"), doing nothing`);
      return;
    }

    stop(`SPA navigated to a different matching page: ${url.href}`);
    childKey = nextKey;
    childCtx = new Context(childName, childOptions);
    debug(`SPA entered a matching page ("${nextKey}"), running main`);
    return await main(childCtx);
  };

  parentCtx.onInvalidated(() =>
    stop('Parent content script context invalidated'),
  );
  parentCtx.addEventListener(window, 'wxt:locationchange', ({ newUrl }) => {
    void run(newUrl).catch((err) => {
      logger.error(
        `The content script "${contentScriptName}" crashed after an SPA navigation to ${newUrl.href}`,
        err,
      );
    });
  });

  // Errors propagate so the virtual entrypoint reports the crash like it would
  // for any other content script.
  return await run(new URL(location.href));
}

function debug(message: string): void {
  if (import.meta.env.DEV) logger.debug(`[spa] ${message}`);
}

/**
 * `definition` is the object the user wrote, so per-browser options are still
 * in their `{ chrome, firefox }` form. `import.meta.env.BROWSER` is a
 * build-time literal, so indexing by it resolves them.
 */
function toMatchPatterns(
  value: PerBrowserOption<string[] | undefined> | undefined,
  field: string,
): MatchPattern[] | undefined {
  if (value == null) return undefined;

  const resolved: unknown = Array.isArray(value)
    ? value
    : value[import.meta.env.BROWSER];
  if (resolved == null) return undefined;
  if (!Array.isArray(resolved)) {
    throw Error(
      `Expected \`${field}\` to be an array of match patterns, got: ${JSON.stringify(resolved)}`,
    );
  }

  return resolved.map((pattern) => new MatchPattern(pattern));
}
