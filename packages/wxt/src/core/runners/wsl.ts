import { ExtensionRunner } from '../../types';
import { relative } from 'node:path';
import { wxt } from '../wxt';

/**
 * WSL sometimes cannot launch browsers.
 *
 * Note: WSLg (DISPLAY=:0) is handled in `createExtensionRunner`.
 */
export function createWslRunner(): ExtensionRunner {
  return {
    async openBrowser() {
      wxt.logger.warn(
        `Cannot auto-open browser when using WSL without WSLg (DISPLAY=:0). Load "${relative(
          process.cwd(),
          wxt.config.outDir,
        )}" as an unpacked extension manually`,
      );
    },
    async closeBrowser() {
      // No-op
    },
  };
}
