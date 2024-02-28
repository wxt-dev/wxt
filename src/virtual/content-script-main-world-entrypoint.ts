import definition from 'virtual:user-content-script-main-world';
import { logger } from '../sandbox/utils/logger';

(async () => {
  try {
    const { main } = definition;
    await main();
  } catch (err) {
    logger.error(
      `The content script "${import.meta.env.ENTRYPOINT}" crashed on startup!`,
      err,
    );
  }
})();
