import type * as vite from 'vite';
import type { ResolvedConfig } from '../../../../types';

const workerRequestRE = /(?:\?|&)worker(?:&|$)/;
const urlRequestRE = /(?:\?|&)url(?:&|$)/;
const workerConstructorUrlRE = /new Worker\(\s*("(?:[^"\\]|\\[\s\S])*")/;
const workerUrlExportRE = /export default\s+("(?:[^"\\]|\\[\s\S])*")/;

/**
 * Ensures workers created by extension pages remain same-origin in dev mode.
 *
 * Vite normally points workers at its HTTP dev server. Chromium extension pages
 * use a `chrome-extension://` origin, so Chromium 148+ rejects those
 * cross-origin worker URLs. A blob script inherits the extension page's origin
 * while still loading the source from Vite.
 */
export function devServerWorkers(wxtConfig: ResolvedConfig): vite.Plugin {
  let devServerOrigin: string | undefined;

  return {
    name: 'wxt:dev-server-workers',
    apply(_, { command }) {
      // Keep other engines on their existing dev-server path; the reported
      // same-origin enforcement regression is specific to Chromium.
      return (
        command === 'serve' &&
        wxtConfig.browser !== 'firefox' &&
        wxtConfig.browser !== 'safari'
      );
    },
    configResolved(viteConfig) {
      devServerOrigin = viteConfig.server.origin;
    },
    transform: {
      order: 'post',
      filter: {
        id: workerRequestRE,
      },
      handler(code, id) {
        if (devServerOrigin == null || !workerRequestRE.test(id)) return;

        const transformed = replaceDevServerWorkerUrl(
          code,
          devServerOrigin,
          !urlRequestRE.test(id),
        );
        if (transformed === code) return;

        return {
          code: transformed,
          map: null,
        };
      },
    },
  };
}

export function replaceDevServerWorkerUrl(
  code: string,
  devServerOrigin: string,
  shouldRevokeBlobUrl: boolean,
) {
  const match = (
    shouldRevokeBlobUrl ? workerConstructorUrlRE : workerUrlExportRE
  ).exec(code);
  const urlLiteral = match?.[1];
  if (match == null || urlLiteral == null) return code;

  let value: unknown;
  try {
    value = JSON.parse(urlLiteral);
  } catch {
    return code;
  }
  if (
    typeof value !== 'string' ||
    !isDevServerWorkerUrl(value, devServerOrigin)
  ) {
    return code;
  }

  const workerScript = createWorkerScript(value, shouldRevokeBlobUrl);
  const blobUrl = `URL.createObjectURL(new Blob([${JSON.stringify(workerScript)}], { type: "text/javascript" }))`;
  const start = match.index + match[0].length - urlLiteral.length;
  return code.slice(0, start) + blobUrl + code.slice(start + urlLiteral.length);
}

function createWorkerScript(url: string, shouldRevokeBlobUrl: boolean) {
  if (shouldRevokeBlobUrl) {
    // Constructor imports create a fresh blob on every call, so the worker can
    // release it immediately after startup.
    return `URL.revokeObjectURL(self.location.href);import ${JSON.stringify(url)};`;
  }

  // `?worker&url` does not expose Vite's `{ type: "module" }` constructor
  // option. Dynamic import keeps the blob valid for both classic and module
  // workers. Buffer early messages until the imported module is ready, and
  // recreate them because stopped events cannot be dispatched again.
  return [
    'const __wxtMessages=[];',
    'const __wxtBufferMessage=(event)=>{',
    'event.stopImmediatePropagation();',
    '__wxtMessages.push(new MessageEvent("message",{',
    'data:event.data,origin:event.origin,lastEventId:event.lastEventId,',
    'source:event.source,ports:event.ports',
    '}));',
    '};',
    'self.addEventListener("message",__wxtBufferMessage);',
    `import(${JSON.stringify(url)}).then(()=>{`,
    'self.removeEventListener("message",__wxtBufferMessage);',
    'for(const event of __wxtMessages)self.dispatchEvent(event);',
    '__wxtMessages.length=0;',
    '},(error)=>{',
    'self.removeEventListener("message",__wxtBufferMessage);',
    'setTimeout(()=>{throw error});',
    '});',
  ].join('');
}

function isDevServerWorkerUrl(value: string, devServerOrigin: string) {
  try {
    const url = new URL(value);
    return (
      url.origin === new URL(devServerOrigin).origin &&
      url.searchParams.has('worker_file')
    );
  } catch {
    return false;
  }
}
