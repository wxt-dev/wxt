import definition from 'virtual:user-content-script';
import { logger } from '../utils/logger';
import { ContentScriptContext } from '../utils/ContentScriptContext';

(async () => {
  try {
    const ctx = new ContentScriptContext(__ENTRYPOINT__);

    await definition.main(ctx);
  } catch (err) {
    logger.error('The content script crashed on startup!', err);
  }
})();
