import type * as vite from 'vite';
import { InternalConfig } from '~/types';
import { getEntrypointName } from '~/core/utils/entrypoints';
import { parseHTML } from 'linkedom';
import { dirname, isAbsolute, relative, resolve } from 'node:path';

// Cache the preamble script for all devHtmlPrerender plugins, not just one
let reactRefreshPreamble = '';

/**
 * Pre-renders the HTML entrypoints when building the extension to connect to the dev server.
 */
export function devHtmlPrerender(
  config: Omit<InternalConfig, 'builder'>,
): vite.PluginOption {
  const htmlReloadId = '@wxt/reload-html';
  const resolvedHtmlReloadId = resolve(
    config.root,
    'node_modules/wxt/dist/virtual/reload-html.js',
  );
  const virtualReactRefreshId = '@wxt/virtual-react-refresh';
  const resolvedVirtualReactRefreshId = '\0' + virtualReactRefreshId;

  return [
    {
      apply: 'build',
      name: 'wxt:dev-html-prerender',
      config() {
        return {
          resolve: {
            alias: {
              [htmlReloadId]: resolvedHtmlReloadId,
            },
          },
        };
      },
      // Convert scripts like src="./main.tsx" -> src="http://localhost:3000/entrypoints/popup/main.tsx"
      // before the paths are replaced with their bundled path
      transform(code, id) {
        const server = config.server;
        if (
          config.command !== 'serve' ||
          server == null ||
          !id.endsWith('.html')
        )
          return;

        const { document } = parseHTML(code);

        const pointToDevServer = (
          querySelector: string,
          attr: string,
        ): void => {
          document.querySelectorAll(querySelector).forEach((element) => {
            const src = element.getAttribute(attr);
            if (!src) return;

            if (isAbsolute(src)) {
              element.setAttribute(attr, server.origin + src);
            } else if (src.startsWith('.')) {
              const abs = resolve(dirname(id), src);
              const pathname = relative(config.root, abs);
              element.setAttribute(attr, `${server.origin}/${pathname}`);
            } else {
              const [alias, path] = Object.entries(config.alias).find(([key]) =>
                src.startsWith(key),
              )!;

              const baseUrl = `${server.origin}/${relative(config.root, path)}`;

              element.setAttribute(
                attr,
                `${baseUrl}${src.replace(`${alias}`, '')}`,
              );
            }
          });
        };
        pointToDevServer('script[type=module]', 'src');
        pointToDevServer('link[rel=stylesheet]', 'href');

        // Add a script to add page reloading
        const reloader = document.createElement('script');
        reloader.src = htmlReloadId;
        reloader.type = 'module';
        document.head.appendChild(reloader);

        const newHtml = document.toString();
        config.logger.debug('transform ' + id);
        config.logger.debug('Old HTML:\n' + code);
        config.logger.debug('New HTML:\n' + newHtml);
        return newHtml;
      },

      // Pass the HTML through the dev server to add dev-mode specific code
      async transformIndexHtml(html, ctx) {
        const server = config.server;
        if (config.command !== 'serve' || server == null) return;

        const originalUrl = `${server.origin}${ctx.path}`;
        const name = getEntrypointName(config.entrypointsDir, ctx.filename);
        const url = `${server.origin}/${name}.html`;
        const serverHtml = await server.transformHtml(url, html, originalUrl);
        const { document } = parseHTML(serverHtml);

        // React pages include a preamble as an unsafe-inline type="module" script to enable fast refresh, as shown here:
        // https://github.com/wxt-dev/wxt/issues/157#issuecomment-1756497616
        // Since unsafe-inline scripts are blocked by MV3 CSPs, we need to virtualize it.
        const reactRefreshScript = Array.from(
          document.querySelectorAll('script[type=module]'),
        ).find((script) => script.innerHTML.includes('@react-refresh'));
        if (reactRefreshScript) {
          // Save preamble to serve from server
          reactRefreshPreamble = reactRefreshScript.innerHTML;

          // Replace unsafe inline script
          const virtualScript = document.createElement('script');
          virtualScript.type = 'module';
          virtualScript.src = `${server.origin}/${virtualReactRefreshId}`;
          reactRefreshScript.replaceWith(virtualScript);
        }

        // Change /@vite/client -> http://localhost:3000/@vite/client
        const viteClientScript = document.querySelector<HTMLScriptElement>(
          "script[src='/@vite/client']",
        );
        if (viteClientScript) {
          viteClientScript.src = `${server.origin}${viteClientScript.src}`;
        }

        const newHtml = document.toString();
        config.logger.debug('transformIndexHtml ' + ctx.filename);
        config.logger.debug('Old HTML:\n' + html);
        config.logger.debug('New HTML:\n' + newHtml);
        return newHtml;
      },
    },
    {
      name: 'wxt:virtualize-react-refresh',
      apply: 'serve',
      resolveId(id) {
        if (id === `/${virtualReactRefreshId}`) {
          return resolvedVirtualReactRefreshId;
        }
        // Ignore chunk contents when pre-rendering
        if (id.startsWith('/chunks/')) {
          return '\0noop';
        }
      },
      load(id) {
        if (id === resolvedVirtualReactRefreshId) {
          return reactRefreshPreamble;
        }
        if (id === '\0noop') {
          return '';
        }
      },
    },
  ];
}
