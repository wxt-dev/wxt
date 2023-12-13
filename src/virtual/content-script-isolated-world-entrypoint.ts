import definition from 'virtual:user-content-script';
import { logger } from '~/client/utils/logger';
import { ContentScriptContext } from '~/client/content-scripts/content-script-context';
import { IsolatedWorldContentScriptDefinition } from '..';

(async () => {
  try {
    const { main, ...options } =
      definition as IsolatedWorldContentScriptDefinition;
    const ctx = new ContentScriptContext(__ENTRYPOINT__, options);

    await main(ctx);
  } catch (err) {
    logger.error(
      `The content script "${__ENTRYPOINT__}" crashed on startup!`,
      err,
    );
  }
})();
