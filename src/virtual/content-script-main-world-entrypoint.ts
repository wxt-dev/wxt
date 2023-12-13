import definition from 'virtual:user-content-script-main-world';
import { logger } from '~/client/utils/logger';

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
