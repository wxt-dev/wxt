import { logger } from '../sandbox/utils/logger';

(async () => {
  try {
    /* vite-ignore */
    await import(__ESM_CONTENT_SCRIPT_URL__);
  } catch (err) {
    logger.error(`Failed to load ESM content script: "${__ENTRYPOINT__}"`, err);
  }
})();
