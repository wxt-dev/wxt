import definition from 'virtual:user-content-script-isolated-world-spa-entrypoint';
import { logger } from '../utils/internal/logger';
import { ContentScriptContext } from 'wxt/utils/content-script-context';
import { runSpaContentScript } from '../utils/internal/spa-content-script';
import { initPlugins } from 'virtual:wxt-plugins';

// Separate from `content-script-isolated-world` so non-SPA content scripts
// don't bundle the SPA handler and match pattern parsing.

const result = (async () => {
  try {
    initPlugins();
    const ctx = new ContentScriptContext(
      import.meta.env.ENTRYPOINT,
      definition,
    );

    return await runSpaContentScript(
      ctx,
      definition,
      import.meta.env.ENTRYPOINT,
    );
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
