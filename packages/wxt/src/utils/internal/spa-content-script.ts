import { MatchPattern } from '@webext-core/match-patterns';
import type { ContentScriptDefinition, PerBrowserOption } from '../../types';
import { ContentScriptContext } from '../content-script-context';
import { logger } from './logger';

interface SpaContentScriptDefinition {
  matches?: PerBrowserOption<string[]>;
  spa?: PerBrowserOption<boolean>;
  main(ctx: any): any;
}

export function runContentScriptWithSpaSupport(
  parentContext: ContentScriptContext,
  definition: SpaContentScriptDefinition,
): void {
  const childMatches = getMatchPatterns(definition.matches);
  let childContext: ContentScriptContext | undefined;

  const run = (url: string, initial = false) => {
    if (!isUrlMatch(childMatches, url)) {
      if (childContext) {
        logger.debug(
          'SPA navigated off matching page, stopping content script',
        );
        childContext.abort('SPA navigated off matching page');
        childContext = undefined;
      } else if (initial) {
        logger.debug('Ignoring initial load of SPA site on non-matching page');
      }
      return;
    }

    if (childContext) {
      logger.debug(
        'SPA navigated to a new matching page, restarting content script',
      );
      childContext.abort('SPA navigated to a new matching page');
    } else if (initial) {
      logger.debug(
        'SPA site loaded on matching page, running content script main function',
      );
    } else {
      logger.debug(
        'SPA navigated to matching page, running content script main function',
      );
    }

    childContext = new ContentScriptContext(
      `${import.meta.env.ENTRYPOINT}:spa`,
      definition as Omit<ContentScriptDefinition, 'main'>,
    );
    void definition.main(childContext);
  };

  run(location.href, true);
  parentContext.addEventListener(window, 'wxt:locationchange', (event) => {
    run(event.newUrl.href);
  });

  parentContext.onInvalidated(() => {
    childContext?.abort('SPA parent content script invalidated');
    childContext = undefined;
  });
}

function isUrlMatch(matches: MatchPattern[] | undefined, url: string): boolean {
  return matches?.some((match) => match.includes(url)) ?? false;
}

function getMatchPatterns(
  matches: PerBrowserOption<string[]> | undefined,
): MatchPattern[] | undefined {
  return resolvePerBrowserOption(matches)?.map(
    (pattern) => new MatchPattern(pattern),
  );
}

function resolvePerBrowserOption<T>(
  value: PerBrowserOption<T> | undefined,
): T | undefined {
  if (value == null || !isPerBrowserMap(value)) return value;
  return (value as Record<string, T>)[import.meta.env.BROWSER];
}

function isPerBrowserMap<T>(
  value: PerBrowserOption<T>,
): value is Record<string, T> {
  return !Array.isArray(value) && typeof value === 'object';
}
