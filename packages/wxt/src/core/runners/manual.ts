import type { ExtensionRunner, ResolvedConfig } from '../../types';
import { relative } from 'node:path';

/**
 * Base runner that just tells developers to load the extension into their
 * browser manually.
 *
 * You can extend this class and call any `super` method when your runner can't
 * open the browser.
 */
export class ManualRunner implements ExtensionRunner {
  constructor(protected config: ResolvedConfig) {}

  canOpen(): Promise<boolean> {
    return Promise.resolve(false);
  }

  async openBrowser(): Promise<void> {
    this.config.logger.info(
      `Load "${relative(process.cwd(), this.config.outDir)}" as an unpacked extension manually`,
    );
  }
}
