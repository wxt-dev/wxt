import definition from 'virtual:user-content-script-main-world-entrypoint';
import { logger } from '../sandbox/utils/logger';

(async () => {
  try {
    const { main } = definition;
    await main();
  } catch (err) {
    logger.error(
      `The content script "${__ENTRYPOINT__}" crashed on startup!`,
      err,
    );
  }
})();
