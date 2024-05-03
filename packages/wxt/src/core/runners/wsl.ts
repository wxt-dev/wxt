import { ExtensionRunner } from '~/types';
import { relative } from 'node:path';
import { wxt } from '../wxt';

/**
 * The WSL runner just logs a warning message because `web-ext` doesn't work in WSL.
 */
export function createWslRunner(): ExtensionRunner {
  return {
    async openBrowser() {
      wxt.logger.warn(
        `Cannot open browser when using WSL. Load "${relative(
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
