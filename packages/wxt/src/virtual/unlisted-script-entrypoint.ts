import definition from 'virtual:user-unlisted-script-entrypoint';
import { logger } from '../utils/internal/logger';
import {
  dispatchScriptSuccessEvent,
  dispatchScriptErrorEvent,
} from '../utils/internal/script-result';
import { initPlugins } from 'virtual:wxt-plugins';

// TODO: This only works with injectScript, not the scripting API.

(async () => {
  try {
    const script = document.currentScript;
    if (script === null) {
      // This should never happen.
      throw new Error(`\`document.currentScript\` is null!`);
    }

    try {
      initPlugins();
      const result = await definition.main();
      dispatchScriptSuccessEvent(script, result);
    } catch (error) {
      dispatchScriptErrorEvent(
        script,
        error instanceof Error ? error : new Error(`${error}`),
      );
    }
  } catch (outerError) {
    // This should never happen.
    logger.error(
      `The unlisted script "${import.meta.env.ENTRYPOINT}" crashed on startup!`,
      outerError,
    );
    throw outerError;
  }
})();

// TODO: The build result fails without this.
export default undefined;
