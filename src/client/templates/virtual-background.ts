import definition from 'virtual:user-background';
import { setupWebSocket } from '../utils/setupWebSocket';
import { logger } from '../utils/logger';
import browser from 'webextension-polyfill';

if (__COMMAND__ === 'serve') {
  try {
    setupWebSocket((message) => {
      switch (message.type) {
        case 'wxt:reload-extension':
          browser.runtime.reload();
          break;
      }
    });
  } catch (err) {
    logger.error('Failed to setup web socket connection with dev server', err);
  }
}

try {
  const res = definition.main();
  // @ts-expect-error: res shouldn't be a promise, but we're checking it anyways
  if (res instanceof Promise) {
    console.warn(
      "The background's main() function return a promise, but it must be synchonous",
    );
  }
} catch (err) {
  logger.error('The background script crashed on startup!');
  throw err;
}
