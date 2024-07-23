import { ExtensionRunner } from '../../types';
import { relative } from 'node:path';
import { wxt } from '../wxt';

/**
 * The manual runner tells the user to load the unpacked extension manually.
 */
export function createManualRunner(): ExtensionRunner {
  return {
    async openBrowser() {
      wxt.logger.info(
        `Load "${relative(
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
