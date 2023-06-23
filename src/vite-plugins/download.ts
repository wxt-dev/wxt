import { Plugin } from 'vite';
import { InternalConfig } from '../types';
import { fetchCached } from '../utils/network';

/**
 * Downloads any URL imports, like Google Analytics, into virtual modules so they are bundled with
 * the extension instead of depending on remote code at runtime.
 *
 * @example
 * import "url:https://google-tagmanager.com/gtag?id=XYZ";
 */
export function download(config: InternalConfig): Plugin {
  return {
    name: 'exvite:download',
    resolveId(id) {
      if (id.startsWith('url:')) return '\0' + id;
    },
    async load(id) {
      if (!id.startsWith('\0url:')) return;

      // Load file from network or cache
      const url = id.replace('\0url:', '');
      return await fetchCached(url, config);
    },
  };
}
