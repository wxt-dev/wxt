import definition from 'virtual:user-content-script-isolated-world-entrypoint';
import { logger } from '../sandbox/utils/logger';
import { ContentScriptContext } from 'wxt/client';

const result = (async () => {
  try {
    const { main, ...options } = definition;
    const ctx = new ContentScriptContext(import.meta.env.ENTRYPOINT, options);

    return await main(ctx);
  } catch (err) {
    logger.error(
      `The content script "${import.meta.env.ENTRYPOINT}" crashed on startup!`,
      err,
    );
    throw err;
  }
})();

// Return the main function's result to the background when executed via the scripting API.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting/executeScript#return_value
// Tested on both Chrome and Firefox
result;
