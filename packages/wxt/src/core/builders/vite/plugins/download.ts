import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';
import type { ResolvedConfig } from '../../../../types';
import { fetchCached } from '../../../utils/network';

/**
 * Downloads any URL imports, like Google Analytics, into virtual modules so
 * they are bundled with the extension instead of depending on remote code at
 * runtime.
 *
 * @example
 *   import 'url:https://google-tagmanager.com/gtag?id=XYZ';
 */
export function download(config: ResolvedConfig): Plugin {
  return {
    name: 'wxt:download',
    enforce: 'pre',
    resolveId: {
      filter: {
        id: /^url:/,
      },
      handler(id) {
        return `\0${id}`;
      },
    },
    load: {
      filter: {
        //eslint-disable-next-line no-control-regex
        id: /^\x00url:/,
      },
      handler(id) {
        const urlImport = id.replace('\0url:', '');
        const integrityPrefix = '#sha256=';
        const integrityIndex = urlImport.lastIndexOf(integrityPrefix);
        if (integrityIndex === -1) {
          throw new Error(`Missing integrity for URL import: ${urlImport}`);
        }

        const url = urlImport.slice(0, integrityIndex);
        const expectedHash = urlImport.slice(integrityIndex + integrityPrefix.length).toLowerCase();
        if (!expectedHash) {
          throw new Error(`Missing SHA-256 digest for URL import: ${urlImport}`);
        }

        return fetchCached(url, config).then((content) => {
          const actualHash = createHash('sha256').update(content).digest('hex');
          if (actualHash !== expectedHash) {
            throw new Error(`SHA-256 mismatch for URL import: ${url}`);
          }
          return content;
        });
      },
    },
  };
}
