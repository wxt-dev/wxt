import definition from 'virtual:user-background';
import { setupWebSocket } from '../client/utils/setup-web-socket';
import { logger } from '../client/utils/logger';
import browser from 'webextension-polyfill';
import { storage } from '~/storage';
import { keepServiceWorkerAlive } from '../client/utils/keep-service-worker-alive';
import { reloadContentScript } from '../client/utils/reload-content-scripts';

if (__COMMAND__ === 'serve') {
  try {
    const ws = setupWebSocket((message) => {
      if (message.event === 'wxt:reload-extension') browser.runtime.reload();
      if (message.event === 'wxt:reload-content-script' && message.data != null)
        reloadContentScript(message.data);
    });

    if (__MANIFEST_VERSION__ === 3) {
      // Tell the server the background script is loaded and ready to go
      ws.addEventListener('open', () => {
        const msg = { type: 'custom', event: 'wxt:background-initialized' };
        ws.send(JSON.stringify(msg));
      });

      // Web Socket will disconnect if the service worker is killed
      keepServiceWorkerAlive();
    }
  } catch (err) {
    logger.error('Failed to setup web socket connection with dev server', err);
  }
}

try {
  // Add utils to global scope so they're accessible from the console during development
  if (import.meta.env.DEV) {
    // @ts-expect-error: Untyped global
    globalThis.wxt = {
      storage,
    };
  }

  const res = definition.main();
  // @ts-expect-error: res shouldn't be a promise, but we're checking it anyways
  if (res instanceof Promise) {
    console.warn(
      "The background's main() function return a promise, but it must be synchonous",
    );
  }
} catch (err) {
  logger.error('The background crashed on startup!');
  throw err;
}
