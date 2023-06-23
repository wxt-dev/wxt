import * as vite from 'vite';
import { InternalConfig } from '../types';
import { getEntrypointName } from '../utils/entrypoints';
import { parseHTML } from 'linkedom';
import { dirname, isAbsolute, relative, resolve } from 'path';

/**
 * Pre-renders the HTML entrypoints when building the extension to connect to the dev server.
 */
export function devHtmlPrerender(config: InternalConfig): vite.Plugin {
  return {
    apply: 'build',
    name: 'exvite:dev-html-prerender',
    async transform(html, id) {
      const server = config.server;
      if (config.command !== 'serve' || server == null || !id.endsWith('.html'))
        return;

      const originalUrl = `${server.origin}${id}`;
      const name = getEntrypointName(config.entrypointsDir, id);
      const url = `${server.origin}/${name}.html`;
      const serverHtml = await server.transformIndexHtml(
        url,
        html,
        originalUrl,
      );
      const { document } = parseHTML(serverHtml);

      const pointToDevServer = (querySelector: string, attr: string): void => {
        document.querySelectorAll(querySelector).forEach((element) => {
          const src = element.getAttribute(attr);
          if (!src) return;

          if (isAbsolute(src)) {
            element.setAttribute(attr, server.origin + src);
          } else if (src.startsWith('.')) {
            const abs = resolve(dirname(id), src);
            const pathname = relative(config.root, abs);
            element.setAttribute(attr, `${server.origin}/${pathname}`);
          }
        });
      };
      pointToDevServer('script[type=module]', 'src');
      pointToDevServer('link[rel=stylesheet]', 'href');

      const newHtml = document.toString();
      config.logger.debug('Transformed ' + id);
      config.logger.debug('Old HTML:\n' + html);
      config.logger.debug('New HTML:\n' + newHtml);
      return newHtml;
    },
  };
}
