import definition from 'virtual:user-content-script';
import { logger } from '../utils/logger';

(async () => {
  try {
    await definition.main();
  } catch (err) {
    logger.error('The content script crashed on startup!', err);
  }
})();
