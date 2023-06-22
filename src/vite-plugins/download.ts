import { Plugin } from 'vite';
import { InternalConfig } from '../types';

/**
 * Downloads any URL imports into virtual modules, like Google Analytics, so they are bundled with
 * the extension instead of depending on remote code.
 *
 * @example
 * import "https://google-tagmanager.com/gtag?id=XYZ";
 */
export function download(config: InternalConfig): Plugin {
  config.logger.warn('Not implemented: download plugin');
  return {
    name: 'exvite:download',
  };
}
