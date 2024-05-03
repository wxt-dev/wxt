import definition from 'virtual:user-unlisted-script-entrypoint';
import { logger } from '../sandbox/utils/logger';

const result = (async () => {
  try {
    return await definition.main();
  } catch (err) {
    logger.error(
      `The unlisted script "${import.meta.env.ENTRYPOINT}" crashed on startup!`,
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
