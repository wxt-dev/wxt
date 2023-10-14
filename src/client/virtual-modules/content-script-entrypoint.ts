import definition from 'virtual:user-content-script';
import { logger } from '../utils/logger';
import { ContentScriptContext } from '../utils/ContentScriptContext';

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
