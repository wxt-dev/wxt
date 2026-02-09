import readline from 'node:readline';
import { WxtDevServer } from '../types';
import { wxt } from './wxt';
import pc from 'picocolors';

export interface KeyboardShortcutWatcher {
  start(): void;
  stop(): void;
  printHelp(flags: { canReopenBrowser: boolean }): void;
}

/**
 * Function that creates a keyboard shortcut handler for the extension.
 */
export function createKeyboardShortcuts(
  server: WxtDevServer,
): KeyboardShortcutWatcher {
  let rl: readline.Interface | undefined;

  const handleInput = (line: string) => {
    // Only handle our specific command
    if (line.trim() === 'o') {
      server.restartBrowser();
    }
  };

  return {
    start() {
      this.stop();

      rl ??= readline.createInterface({
        input: process.stdin,
        terminal: false, // Don't intercept ctrl+C, ctrl+Z, etc
      });

      rl.on('line', handleInput);
    },

    stop() {
      rl?.removeListener('line', handleInput);
    },

    printHelp(flags) {
      if (flags.canReopenBrowser) {
        wxt.logger.info(
          `${pc.dim('Press')} ${pc.bold('o + enter')} ${pc.dim('to reopen the browser')}`,
        );
      }
    },
  };
}
