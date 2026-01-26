import { ExtensionRunner } from '../../types';
import { relative } from 'node:path';
import { wxt } from '../wxt';

/**
 * WSL sometimes cannot launch browsers.
 *
 * Note: WSL with GUI (DISPLAY or WAYLAND_DISPLAY set) is handled in `createExtensionRunner`.
 */
export function createWslRunner(): ExtensionRunner {
  return {
    async openBrowser() {
      wxt.logger.warn(
        `Cannot auto-open browser when using WSL without a GUI environment (no DISPLAY or WAYLAND_DISPLAY set). Load "${relative(
          process.cwd(),
          wxt.config.outDir,
        )}" as an unpacked extension manually`,
      );
    },
    async closeBrowser() {
      // noop
    },
  };
}
