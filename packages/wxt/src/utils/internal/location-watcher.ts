import { ContentScriptContext } from '../content-script-context';
import { WxtLocationChangeEvent } from './custom-events';

const supportsNavigationApi =
  (globalThis as any).navigation !== 'undefined' &&
  (globalThis as any).navigation.addEventListener === 'function';

/**
 * Create a util that watches for URL changes, dispatching the custom event when detected. Stops
 * watching when content script is invalidated. Uses Navigation API when available, otherwise
 * falls back to polling.
 */
export function createLocationWatcher(ctx: ContentScriptContext) {
  let lastUrl: URL;
  let watching = false;

  return {
    /**
     * Ensure the location watcher is actively looking for URL changes. If it's already watching,
     * this is a noop.
     */
    run() {
      if (watching) return;
      watching = true;
      lastUrl = new URL(location.href);

      if (supportsNavigationApi) {
        (globalThis as any).navigation.addEventListener(
          'navigate',
          (event: any) => {
            const newUrl = new URL(event.destination.url);
            if (newUrl.href === lastUrl.href) return;
            window.dispatchEvent(new WxtLocationChangeEvent(newUrl, lastUrl));
            lastUrl = newUrl;
          },
          { signal: ctx.signal },
        );
      } else {
        ctx.setInterval(() => {
          const newUrl = new URL(location.href);
          if (newUrl.href !== lastUrl.href) {
            window.dispatchEvent(new WxtLocationChangeEvent(newUrl, lastUrl));
            lastUrl = newUrl;
          }
        }, 1e3);
      }
    },
  };
}
