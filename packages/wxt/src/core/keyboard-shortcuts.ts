import readline from 'node:readline';
import { WxtDevServer } from '../types';

export interface KeyboardShortcutWatcher {
  start(): void;
  stop(): void;
}

/**
 * Function that creates a keyboard shortcut handler for the extension.
 */
export function createKeyboardShortcuts(
  server: WxtDevServer,
): KeyboardShortcutWatcher {
  let isWatching = false;
  let rl: readline.Interface | null = null;

  const handleInput = (line: string) => {
    if (line.trim() === 'o') {
      server.restartBrowser();
    }
  };

  return {
    start() {
      if (isWatching) return;

      rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.on('line', handleInput);

      isWatching = true;
    },

    stop() {
      if (!isWatching) return;

      if (rl) {
        rl.close();
        rl = null;
      }

      isWatching = false;
    },
  };
}
