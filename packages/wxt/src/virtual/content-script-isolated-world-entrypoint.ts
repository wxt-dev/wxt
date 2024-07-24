import definition from 'virtual:user-content-script-isolated-world-entrypoint';
import { logger } from '../sandbox/utils/logger';
import { ContentScriptContext } from 'wxt/client';
import { initPlugins } from 'virtual:wxt-plugins';

const result = (async () => {
  try {
    initPlugins();
    const ctx = new ContentScriptContext(
      import.meta.env.ENTRYPOINT,
      definition,
    );

    return await definition.main(ctx);
  } catch (err) {
    logger.error(
      `The content script "${import.meta.env.ENTRYPOINT}" crashed on startup!`,
      err,
    );
    throw err;
  }
})();

// Return the main function's result to the background when executed via the
// scripting API. Default export causes the IIFE to return a value.
// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/scripting/executeScript#return_value
// Tested on both Chrome and Firefox
export default result;
