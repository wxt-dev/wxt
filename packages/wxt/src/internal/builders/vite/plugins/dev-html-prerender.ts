import { dirname, relative, resolve } from 'node:path';

import { hash } from 'ohash';
import type * as vite from 'vite';

import { getEntrypointName } from '../../../../internal-utils/entrypoint-utils';
import {
  applyHtmlEdits,
  HtmlEdit,
  HtmlTag,
  insertIntoHeadEdit,
  removeAttributeEdit,
  scanHtml,
  setAttributeEdit,
} from '../../../../internal-utils/html-utils';
import { normalizePath } from '../../../../internal-utils/path-utils';
import { virtualModules } from '../../../../internal-utils/virtual-modules';
import { ResolvedConfig, WxtDevServer } from '../../../../types';

// Stored outside the plugin to effect all instances of the devHtmlPrerender plugin.
const inlineScriptContents: Record<string, string> = {};

/**
 * Pre-renders the HTML entrypoints when building the extension to connect to
 * the dev server.
 */
export function devHtmlPrerender(
  config: ResolvedConfig,
  server: WxtDevServer | undefined,
): vite.PluginOption {
  const htmlReloadId = '@wxt/reload-html';
  const resolvedHtmlReloadId = '\0virtual:wxt-reload-html';

  const virtualInlineScript = 'virtual:wxt-inline-script';
  const resolvedVirtualInlineScript = '\0' + virtualInlineScript;

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
      transform: {
        filter: {
          id: /\.html$/,
        },
        handler(code, id) {
          if (config.command !== 'serve' || server == null) return;

          const tags = scanHtml(code);
          const edits: HtmlEdit[] = [];
          for (const tag of tags) {
            if (tag.name === 'script' && tag.attrs.type === 'module') {
              edits.push(
                ...pointToDevServer(config, server, id, code, tag, 'src'),
              );
            } else if (tag.name === 'link' && tag.attrs.rel === 'stylesheet') {
              edits.push(
                ...pointToDevServer(config, server, id, code, tag, 'href'),
              );
            }
          }

          // Add a script to add page reloading
          edits.push(
            insertIntoHeadEdit(
              code,
              tags,
              `<script src="${htmlReloadId}" type="module"></script>`,
              'end',
            ),
          );

          const newHtml = applyHtmlEdits(code, edits);
          config.logger.debug('transform ' + id);
          config.logger.debug('Old HTML:\n' + code);
          config.logger.debug('New HTML:\n' + newHtml);
          return newHtml;
        },
      },

      // Pass the HTML through the dev server to add dev-mode specific code
      async transformIndexHtml(html, ctx) {
        if (config.command !== 'serve' || server == null) return;

        const originalUrl = `${server.origin}${ctx.path}`;
        const name = getEntrypointName(config.entrypointsDir, ctx.filename);
        const url = `${server.origin}/${name}.html`;
        const serverHtml = await server.transformHtml(url, html, originalUrl);
        const tags = scanHtml(serverHtml);
        const edits: HtmlEdit[] = [];

        for (const tag of tags) {
          if (tag.name !== 'script') continue;

          if (tag.attrs.src == null) {
            // Replace inline script with virtual module served via dev server.
            // Extension CSP blocks inline scripts, so that's why we're pulling
            // them out.
            const textContent = tag.text;
            const key = hash(textContent);
            inlineScriptContents[key] = textContent;
            edits.push({
              start: tag.start,
              end: tag.closeEnd ?? tag.openEnd,
              text: `<script type="module" src="${server.origin}/@id/${virtualInlineScript}?${key}"></script>`,
            });
          } else if (tag.attrs.src === '/@vite/client') {
            // Change /@vite/client -> http://localhost:3000/@vite/client
            edits.push(
              setAttributeEdit(tag, 'src', `${server.origin}${tag.attrs.src}`),
            );
          }
        }

        const newHtml = applyHtmlEdits(serverHtml, edits);
        config.logger.debug('transformIndexHtml ' + ctx.filename);
        config.logger.debug('Old HTML:\n' + html);
        config.logger.debug('New HTML:\n' + newHtml);
        return newHtml;
      },
    },
    {
      name: 'wxt:reload-html-module',
      apply: 'build',
      resolveId: {
        filter: {
          id: new RegExp(`^${resolvedHtmlReloadId}$`),
        },
        handler(id) {
          return id;
        },
      },
      load: {
        filter: {
          id: new RegExp(`^${resolvedHtmlReloadId}$`),
        },
        handler() {
          return virtualModules['reload-html'];
        },
      },
    },
    {
      name: 'wxt:virtualize-inline-scripts',
      apply: 'serve',
      resolveId: {
        filter: {
          id: [new RegExp(`^${virtualInlineScript}`), new RegExp('^/chunks/')],
        },
        handler(id) {
          // Ignore chunks during HTML file pre-rendering
          if (id.startsWith('/chunks/')) {
            return '\0noop';
          }

          return `\0${id}`;
        },
      },
      load: {
        filter: {
          id: [
            new RegExp(`^${resolvedVirtualInlineScript}`),
            //eslint-disable-next-line no-control-regex
            new RegExp('^\x00noop'),
          ],
        },
        handler(id) {
          // Ignore chunks during HTML file pre-rendering
          if (id === '\0noop') {
            return '';
          }

          // id="virtual:wxt-inline-script?<key>"
          const key = id.substring(id.indexOf('?') + 1);
          return inlineScriptContents[key];
        },
      },
    },
  ];
}

/** Returns the edits that point a tag's `attr` at the dev server. */
export function pointToDevServer(
  config: ResolvedConfig,
  server: WxtDevServer,
  id: string,
  html: string,
  tag: HtmlTag,
  attr: string,
): HtmlEdit[] {
  if ('vite-ignore' in tag.attrs || 'wxt-ignore' in tag.attrs) {
    return removeAttributeEdit(html, tag, 'wxt-ignore');
  }
  const src = tag.attrs[attr];
  if (!src || isUrl(src)) return [];

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

  const relativePath = normalizePath(
    relative(config.root, resolvedAbsolutePath),
  );

  let newSrc: string;
  if (relativePath.startsWith('.')) {
    // Outside the config.root directory, serve the absolute path
    let path = normalizePath(resolvedAbsolutePath);
    // Add "/" to start of windows paths ("D:/some/path" -> "/D:/some/path")
    if (!path.startsWith('/')) path = '/' + path;
    newSrc = `${server.origin}/@fs${path}`;
  } else {
    // Inside the project, use relative path
    newSrc = new URL(relativePath, server.origin).href;
  }
  return [setAttributeEdit(tag, attr, newSrc)];
}

function isUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
