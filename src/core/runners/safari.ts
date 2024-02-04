import { ExtensionRunner } from '~/types';
import { relative } from 'node:path';
import { wxt } from '../utils/wxt';

/**
 * The Safari runner just logs a warning message because `web-ext` doesn't work with Safari.
 */
export function createSafariRunner(): ExtensionRunner {
  return {
    async openBrowser() {
      wxt.logger.warn(
        `Cannot Safari using web-ext. Load "${relative(
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
