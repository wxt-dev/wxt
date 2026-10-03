import { parseHTML } from 'linkedom';
import type * as vite from 'vite';
import { normalizePath } from '../../../utils';
import { getEntrypointName } from '../../../utils/entrypoints';
import { Entrypoint, ResolvedConfig, WxtPluginEntry } from '../../../../types';
import { wxt } from '../../../wxt';

export function getPluginModules(
  plugins: WxtPluginEntry[],
  entrypoint: Entrypoint | undefined,
): string[] {
  return plugins
    .filter(
      (plugin) => entrypoint == null || (plugin.apply?.(entrypoint) ?? true),
    )
    .map((plugin) => plugin.module);
}

/**
 * Resolve and load plugins for each entrypoint. This handles both JS
 * entrypoints via the `virtual:wxt-plugins` import, and HTML files by adding
 * `virtual:wxt-html-plugins` to the document's `<head>`. Accepts an optional
 * `?entrypoint=<name>` query to evaluate plugin `apply` hooks per request.
 */
export function wxtPluginLoader(config: ResolvedConfig): vite.Plugin {
  const virtualModuleId = 'virtual:wxt-plugins';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;
  const virtualHtmlModuleId = 'virtual:wxt-html-plugins';
  const resolvedVirtualHtmlModuleId = '\0' + virtualHtmlModuleId;

  function getEntrypointFromId(id: string): Entrypoint | undefined {
    const queryIndex = id.indexOf('?');
    if (queryIndex === -1) return undefined;
    const entrypointNameFromQueryParam = new URLSearchParams(
      id.slice(queryIndex),
    ).get('entrypoint');
    if (!entrypointNameFromQueryParam) return undefined;
    return wxt.entrypoints.find(
      (entry) => entry.name === entrypointNameFromQueryParam,
    );
  }

  return {
    name: 'wxt:plugin-loader',
    resolveId: {
      filter: {
        id: [
          new RegExp(`^${virtualModuleId}`),
          new RegExp(`^${virtualHtmlModuleId}`),
        ],
      },
      handler(id) {
        return '\0' + id;
      },
    },
    load: {
      filter: {
        id: [
          new RegExp(`^${resolvedVirtualModuleId}`),
          new RegExp(`^${resolvedVirtualHtmlModuleId}`),
        ],
      },
      handler(id) {
        const bareId = id.slice(1);
        const entrypoint = getEntrypointFromId(bareId);

        if (
          bareId === virtualModuleId ||
          bareId.startsWith(`${virtualModuleId}?`)
        ) {
          // Import and init only the plugins that apply to this entrypoint
          const modules = getPluginModules(config.plugins, entrypoint);
          const imports = modules
            .map(
              (module, i) =>
                `import initPlugin${i} from '${normalizePath(module)}';`,
            )
            .join('\n');
          const initCalls = modules
            .map((_, i) => `  initPlugin${i}();`)
            .join('\n');
          return `${imports}\n\nexport function initPlugins() {\n${initCalls}\n}`;
        } else {
          // Forward resolved entrypoint to match the JS module.
          const jsModuleId = entrypoint
            ? `${virtualModuleId}?entrypoint=${encodeURIComponent(entrypoint.name)}`
            : virtualModuleId;
          return `import { initPlugins } from '${jsModuleId}';
            try {
              initPlugins();
            } catch (err) {
              console.error("[wxt] Failed to initialize plugins", err);
            }`;
        }
      },
    },
    transformIndexHtml: {
      // Use "pre" so the new script is added before vite bundles all the scripts
      order: 'pre',
      // `_ctx` -> `ctx` To access entrypoint info for per-page plugin filtering.
      handler(html, ctx) {
        const entrypointName = getEntrypointName(
          config.entrypointsDir,
          ctx.filename,
        );
        const entrypoint = wxt.entrypoints.find(
          (entry) => entry.name === entrypointName,
        );
        const query = entrypoint
          ? `?entrypoint=${encodeURIComponent(entrypoint.name)}`
          : '';
        const htmlModuleId = `${virtualHtmlModuleId}${query}`;

        const src =
          config.command === 'serve'
            ? `${config.dev.server?.origin}/@id/${htmlModuleId}`
            : htmlModuleId;

        const { document } = parseHTML(html);
        const existing = document.querySelector(`script[src='${src}']`);
        if (existing) return;

        const script = document.createElement('script');
        script.type = 'module';
        script.src = src;

        if (document.head == null) {
          const newHead = document.createElement('head');
          document.documentElement.prepend(newHead);
        }

        document.head?.prepend(script);
        return document.toString();
      },
    },
  };
}
