import { ExtensionRunner } from './extension-runner';
import { relative } from 'node:path';

/**
 * The WSL runner just logs a warning message because `web-ext` doesn't work in WSL.
 */
export function createWslRunner(): ExtensionRunner {
  return {
    async openBrowser(config) {
      config.logger.warn(
        `Cannot open browser when using WSL. Load "${relative(
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
