import definition from 'virtual:user-content-script-isolated-world-entrypoint';
import { logger } from '../sandbox/utils/logger';
import { ContentScriptContext } from 'wxt/client';

(async () => {
  try {
    const { main, ...options } = definition;
    const ctx = new ContentScriptContext(import.meta.env.ENTRYPOINT, options);

    await main(ctx);
  } catch (err) {
    logger.error(
      `The content script "${import.meta.env.ENTRYPOINT}" crashed on startup!`,
      err,
    );
  }
})();
