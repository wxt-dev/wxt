import { Plugin } from 'vite';
import { ResolvedConfig } from '../../../../types';
import { fetchCached } from '../../../utils/network';

/**
 * Downloads any URL imports, like Google Analytics, into virtual modules so they are bundled with
 * the extension instead of depending on remote code at runtime.
 *
 * @example
 * import "url:https://google-tagmanager.com/gtag?id=XYZ";
 */
export function download(config: ResolvedConfig): Plugin {
  return {
    name: 'wxt:download',
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
      async handler(id) {
        const url = id.replace('\0url:', '');
        return await fetchCached(url, config);
      },
    },
  };
}
