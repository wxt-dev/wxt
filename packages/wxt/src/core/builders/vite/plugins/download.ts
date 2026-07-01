import { wxt } from '../../../wxt';
import type { Plugin } from 'vite';
import type { ResolvedConfig } from '../../../../types';
import { fetchCached } from '../../../utils/network';

/**
 * Downloads any URL imports, like Google Analytics, into virtual modules so
 * they are bundled with the extension instead of depending on remote code at
 * runtime.
 *
 * @deprecated Don't use this, it can cause potential supply chain attacks. You
 *   can download the files and host it in your repo instead.
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
        wxt.logger.warn(
          '`url:` import is deprecated, see https://github.com/wxt-dev/wxt/issues/2262. You can download the files and host it in your repo instead',
        );
        return fetchCached(url, config);
      },
    },
  };
}
