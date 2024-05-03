import definition from 'virtual:user-content-script-isolated-world-entrypoint';
import { logger } from '../sandbox/utils/logger';
import { ContentScriptContext } from 'wxt/client';

(async () => {
  try {
    const { main, ...options } = definition;
    const ctx = new ContentScriptContext(__ENTRYPOINT__, options);

    await main(ctx);
  } catch (err) {
    logger.error(
      `The content script "${__ENTRYPOINT__}" crashed on startup!`,
      err,
    );
  }
})();
