import definition from 'virtual:user-unlisted-script-entrypoint';
import { logger } from '../sandbox/utils/logger';

(async () => {
  try {
    await definition.main();
  } catch (err) {
    logger.error(
      `The unlisted script "${import.meta.env.ENTRYPOINT}" crashed on startup!`,
      err,
    );
  }
})();
