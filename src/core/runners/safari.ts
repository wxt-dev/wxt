import { ExtensionRunner } from './extension-runner';
import { relative } from 'node:path';

/**
 * The Safari runner just logs a warning message because `web-ext` doesn't work with Safari.
 */
export function createSafariRunner(): ExtensionRunner {
  return {
    async openBrowser(config) {
      config.logger.warn(
        `Cannot Safari using web-ext. Load "${relative(
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
