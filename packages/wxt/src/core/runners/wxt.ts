import { ExtensionRunner } from '../../types';
import { formatDuration } from '../utils/time';
import { wxt } from '../wxt';
import { run, type Runner } from '@wxt-dev/runner';

/** Create an `ExtensionRunner` backed by `@wxt-dev/runner`. */
export function createWxtRunner(): ExtensionRunner {
  let runner: Runner | undefined;

  return {
    canOpen() {
      return true;
    },
    async openBrowser() {
      const startTime = Date.now();

      runner = await run({
        target: wxt.config.browser,
        extensionDir: wxt.config.outDir,
        ...wxt.config.runnerConfig.config,
      });

      const duration = Date.now() - startTime;
      wxt.logger.success(`Opened browser in ${formatDuration(duration)}`);
    },

    async closeBrowser() {
      runner?.stop();
    },
  };
}
