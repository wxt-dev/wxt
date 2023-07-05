import definition from 'virtual:user-background';
import { setupWebSocket } from '../utils/setupWebSocket';
import { logger } from '../utils/logger';
import browser from 'webextension-polyfill';
import { keepServiceWorkerAlive } from '../utils/keepServiceWorkerAlive';
import { reloadContentScript } from '../utils/reloadContentScript';

if (__COMMAND__ === 'serve') {
  try {
    const ws = setupWebSocket((message) => {
      if (message.event === 'wxt:reload-extension') browser.runtime.reload();
      if (message.event === 'wxt:reload-content-script' && message.data != null)
        reloadContentScript(message.data);
    });

    // Tell the server the background script is loaded and ready to go
    ws.addEventListener('open', () => {
      const msg = { type: 'custom', event: 'wxt:background-initialized' };
      ws.send(JSON.stringify(msg));
    });

    // Web Socket will disconnect if the service worker is killed
    keepServiceWorkerAlive();
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
