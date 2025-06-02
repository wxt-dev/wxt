import { ExtensionRunner } from '../../types';
import { relative } from 'node:path';
import { wxt } from '../wxt';

/**
 * The Safari runner just logs a warning message because `@wxt-dev/runner` doesn't work with Safari.
 */
export function createSafariRunner(): ExtensionRunner {
  return {
    async openBrowser() {
      wxt.logger.warn(
        `Cannot Safari using @wxt-dev/runner. Load "${relative(
          process.cwd(),
          wxt.config.outDir,
        )}" via XCode instead`,
      );
    },
    async closeBrowser() {
      // noop
    },
  };
}
