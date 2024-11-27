import { WxtDevServer } from '../types';

export interface KeyboardShortcutWatcher {
  start(): void;
  stop(): void;
}

/**
 * Function that creates a key board shortcut the extension.
 */
export function createKeyBoardShortCuts(
  server: WxtDevServer,
): KeyboardShortcutWatcher {
  let originalRawMode: boolean | undefined;
  let isWatching = false;
  const handleInput = (data: Buffer) => {
    const char = data.toString();
    if (char === 'o') {
      server.restartBrowser();
    }
  };

  return {
    start() {
      if (isWatching) return;
      originalRawMode = process.stdin.isRaw;
      process.stdin.setRawMode(true);
      process.stdin.resume();

      process.stdin.on('data', handleInput);
      isWatching = true;
    },

    stop() {
      if (!isWatching) return;
      process.stdin.removeListener('data', handleInput);
      if (originalRawMode !== undefined) {
        process.stdin.setRawMode(originalRawMode);
      }
      process.stdin.pause();
      isWatching = false;
    },
  };
}
