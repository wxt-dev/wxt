import definition from 'virtual:user-content-script-isolated-world';
import { logger } from '~/client/utils/logger';
import { ContentScriptContext } from '~/client/content-scripts/content-script-context';

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
