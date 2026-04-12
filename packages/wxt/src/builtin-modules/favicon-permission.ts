import { defineWxtModule } from '../modules';

/**
 * Adds a template-literal type for the `_favicon/` paths served by Chrome's
 * favicon API when the `favicon` permission is declared. With this module,
 * `browser.runtime.getURL('/_favicon/?pageUrl=...')` type-checks without
 * needing a `@ts-expect-error`.
 *
 * Extensions that load favicons from a content script must still add their own
 * `web_accessible_resources` entry — this module intentionally does not touch
 * the manifest. See the review thread on #1570 for context.
 *
 * @see https://developer.chrome.com/docs/extensions/how-to/ui/favicons
 */
export default defineWxtModule({
  name: 'wxt:built-in:favicon-permission',
  setup(wxt) {
    wxt.hooks.hook('prepare:publicPaths', (_, paths) => {
      if (!wxt.config.manifest.permissions?.includes('favicon')) return;

      paths.push({
        type: 'templateLiteral',
        path: '_favicon/?${string}',
      });
    });
  },
});
