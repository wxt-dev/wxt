import type * as vite from 'vite';
import { ResolvedConfig, WxtDevServer } from '~/types';
import { getEntrypointName } from '~/core/utils/entrypoints';
import { parseHTML } from 'linkedom';
import { dirname, relative, resolve } from 'node:path';
import { normalizePath } from '~/core/utils/paths';

// Cache the preamble script for all devHtmlPrerender plugins, not just one
let reactRefreshPreamble = '';

/**
 * Pre-renders the HTML entrypoints when building the extension to connect to the dev server.
 */
export function devHtmlPrerender(
  config: Omit<ResolvedConfig, 'builder'>,
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

        const _pointToDevServer = (querySelector: string, attr: string) =>
          pointToDevServer(config, server, id, document, querySelector, attr);
        _pointToDevServer('script[type=module]', 'src');
        _pointToDevServer('link[rel=stylesheet]', 'href');

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

export function pointToDevServer(
  config: Omit<ResolvedConfig, 'builder'>,
  server: WxtDevServer,
  id: string,
  document: Document,
  querySelector: string,
  attr: string,
) {
  document.querySelectorAll(querySelector).forEach((element) => {
    const src = element.getAttribute(attr);
    if (!src || isUrl(src)) return;

    let resolvedAbsolutePath: string | undefined;

    // Check if src uses a project alias
    const matchingAlias = Object.entries(config.alias).find(([key]) =>
      src.startsWith(key),
    );
    if (matchingAlias) {
      // Matches a import alias
      const [alias, replacement] = matchingAlias;
      resolvedAbsolutePath = resolve(
        config.root,
        src.replace(alias, replacement),
      );
    } else {
      // Some file path relative to the HTML file
      resolvedAbsolutePath = resolve(dirname(id), src);
    }

    // Apply the final file path
    if (resolvedAbsolutePath) {
      const relativePath = normalizePath(
        relative(config.root, resolvedAbsolutePath),
      );

      if (relativePath.startsWith('.')) {
        // Outside the config.root directory, serve the absolute path
        let path = normalizePath(resolvedAbsolutePath);
        // Add "/" to start of windows paths ("D:/some/path" -> "/D:/some/path")
        if (!path.startsWith('/')) path = '/' + path;
        element.setAttribute(attr, `${server.origin}/@fs${path}`);
      } else {
        // Inside the project, use relative path
        const url = new URL(relativePath, server.origin);
        element.setAttribute(attr, url.href);
      }
    }
  });
}

function isUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
