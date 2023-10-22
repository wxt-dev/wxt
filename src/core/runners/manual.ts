import { ExtensionRunner } from '~/types';
import { relative } from 'node:path';

/**
 * The manual runner tells the user to load the unpacked extension manually.
 */
export function createManualRunner(): ExtensionRunner {
  return {
    async openBrowser(config) {
      config.logger.info(
        `Load "${relative(
          process.cwd(),
          config.outDir,
        )}" as an unpacked extension manually`,
      );
    },
    async closeBrowser() {
      // noop
    },
  };
}
