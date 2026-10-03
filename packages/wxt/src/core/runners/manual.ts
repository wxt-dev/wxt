import type { ExtensionRunner } from '../../types';
import { relative } from 'node:path';
import { wxt } from '../wxt';

/**
 * Base runner that just tells developers to load the extension into their
 * browser manually.
 *
 * You can extend this class and call any `super` method when your runner can't
 * open the browser.
 */
export class ManualRunner implements ExtensionRunner {
  constructor() {}

  canOpen(): Promise<boolean> {
    return Promise.resolve(false);
  }

  async openBrowser(): Promise<void> {
    wxt.logger.info(
      `Load "${this.relativeOutDir()}" as an unpacked extension manually`,
    );
  }

  protected relativeOutDir(): string {
    return relative(process.cwd(), wxt.config.outDir);
  }
}
