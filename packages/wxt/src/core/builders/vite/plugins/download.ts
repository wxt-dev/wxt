import type { Plugin } from 'vite';
import type { ResolvedConfig } from '../../../../types';
import { fetchCached } from '../../../utils/network';
import consola from 'consola';

/**
 * Downloads any URL imports, like Google Analytics, into virtual modules so
 * they are bundled with the extension instead of depending on remote code at
 * runtime.
 *
 * @deprecated This feature is susceptible to supply-chain attacks and will be
 *   removed in the next major version of WXT. See
 *   https://github.com/wxt-dev/wxt/issues/2262 for more details.'
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
        const url = id.replace('\0url:', '');
        consola.warn(
          `Deprecated: This feature is susceptible to supply-chain attacks and will be removed in the next major version of WXT. See https://github.com/wxt-dev/wxt/issues/2262 for more details.`,
        );
        return fetchCached(url, config);
      },
    },
  };
}
