import { Plugin } from 'vite';

/**
 * Downloads any URL imports into virtual modules, like Google Analytics, so they are bundled with
 * the extension instead of depending on remote code.
 *
 * @example
 * import "https://google-tagmanager.com/gtag?id=XYZ";
 */
export function download(): Plugin {
  console.warn('Not implemented: download plugin');
  return {
    name: 'exvite:download',
  };
}
