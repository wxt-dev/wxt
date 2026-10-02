import { ExtensionRunner } from '../../types';
import { relative } from 'node:path';
import { wxt } from '../wxt';

/**
 * The WSL runner just logs a warning message because `web-ext` can't open
 * Chromium browsers in WSL. Firefox doesn't need it.
 */
export function createWslRunner(): ExtensionRunner {
  return {
    async openBrowser() {
      wxt.logger.warn(
        `Cannot open Chromium browsers when using WSL. Load "${relative(
          process.cwd(),
          wxt.config.outDir,
        )}" as an unpacked extension manually, or use Firefox (\`wxt -b firefox\`). See https://github.com/GoogleChrome/chrome-launcher/issues/334`,
      );
    },
  };
}
