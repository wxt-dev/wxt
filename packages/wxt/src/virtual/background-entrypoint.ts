import definition from 'virtual:user-background-entrypoint';
import { initPlugins } from 'virtual:wxt-plugins';
import { logger } from '../sandbox/utils/logger';
import { browser } from 'wxt/browser';
import { keepServiceWorkerAlive } from './utils/keep-service-worker-alive';
import { reloadContentScript } from './utils/reload-content-scripts';

if (import.meta.hot) {
  import.meta.hot.on('wxt:reload-extension', () => browser.runtime.reload());
  import.meta.hot.on('wxt:reload-content-script', (event) =>
    reloadContentScript(event.detail),
  );

  if (import.meta.env.MANIFEST_VERSION === 3) {
    let backgroundInitialized = false;
    // Tell the server the background script is loaded and ready to go
    import.meta.hot.on('vite:ws:connect', () => {
      if (backgroundInitialized) return;

      import.meta.hot?.send('wxt:background-initialized');
      backgroundInitialized = true;
    });

    // Web Socket will disconnect if the service worker is killed
    keepServiceWorkerAlive();
  }

  browser.commands.onCommand.addListener((command) => {
    if (command === 'wxt:reload-extension') {
      browser.runtime.reload();
    }
  });
}

let result;

try {
  initPlugins();
  result = definition.main();
  // @ts-expect-error: res shouldn't be a promise, but we're checking it anyways
  if (result instanceof Promise) {
    console.warn(
      "The background's main() function return a promise, but it must be synchronous",
    );
  }
} catch (err) {
  logger.error('The background crashed on startup!');
  throw err;
}

// Return the main function's result to the background when executed via the
// scripting API. Default export causes the IIFE to return a value.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting/executeScript#return_value
// Tested on both Chrome and Firefox
export default result;
