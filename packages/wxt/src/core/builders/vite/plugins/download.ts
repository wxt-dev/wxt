import type { Plugin } from 'vite';
import type { ResolvedConfig } from '../../../../types';
import { fetchCached } from '../../../utils/network';
import {
  hashContent,
  parseUrlImport,
  verifyIntegrity,
} from '../../../utils/integrity';

/**
 * Downloads any URL imports into virtual modules so they are bundled with the
 * extension instead of depending on remote code at runtime.
 *
 * Every import must pin an integrity hash. Without one, a compromised CDN could
 * silently ship arbitrary code inside your extension.
 *
 * @example
 *   import 'url#sha256-kmHvs0B+OpCW5GVHUNjv9rOmY0IvSIRcf7zGUDTDQM8=:https://code.jquery.com/jquery-3.7.1.slim.min.js';
 */
export function download(config: ResolvedConfig): Plugin {
  return {
    name: 'wxt:download',
    enforce: 'pre',
    resolveId: {
      filter: {
        id: /^url[:#]/,
      },
      handler(id) {
        return `\0${id}`;
      },
    },
    load: {
      filter: {
        //eslint-disable-next-line no-control-regex
        id: /^\x00url[:#]/,
      },
      async handler(id) {
        const specifier = id.slice(1);
        const parsed = parseUrlImport(specifier);
        if (!parsed) {
          throw Error(
            `Invalid URL import: "${specifier}". Expected "url#<integrity>:<url>".`,
          );
        }

        const { url, integrity } = parsed;
        if (!integrity) {
          throw Error(await missingIntegrityMessage(url, config));
        }

        return await fetchCached(url, config, {
          verify: (content) => verifyIntegrity(content, integrity, url),
        });
      },
    },
  };
}

async function missingIntegrityMessage(
  url: string,
  config: ResolvedConfig,
): Promise<string> {
  const base = `URL imports must pin an integrity hash: "url:${url}"`;

  let suggestion: string;
  try {
    const content = await fetchCached(url, config, { noCache: true });
    suggestion = `import 'url#${hashContent(content)}:${url}';`;
  } catch {
    suggestion = `import 'url#<integrity>:${url}';`;
  }

  return (
    `${base}\n\n` +
    `  ${suggestion}\n\n` +
    `Review the file at that URL before pinning it. A hash locks in whatever is served today, but it doesn't make untrusted code safe.`
  );
}
