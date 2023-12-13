import definition from 'virtual:user-content-script';
import { logger } from '~/client/utils/logger';
import { MainWorldContentScriptDefinition } from '..';

(async () => {
  try {
    const { main } = definition as MainWorldContentScriptDefinition;
    await main();
  } catch (err) {
    logger.error(
      `The content script "${__ENTRYPOINT__}" crashed on startup!`,
      err,
    );
  }
})();
