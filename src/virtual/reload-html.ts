/// <reference types="vite/client" />

import { logger } from '~/client/utils/logger';
import { setupWebSocket } from '~/client/utils/setup-web-socket';

if (__COMMAND__ === 'serve') {
  try {
    setupWebSocket((message) => {
      if (message.event === 'wxt:reload-page') {
        // We need to remove the initial slash from the path to compare correctly
        // "popup.html" === "/popup.html".substring(1)
        if (message.data === location.pathname.substring(1)) {
          location.reload();
        }
      }
    });
  } catch (err) {
    logger.error('Failed to setup web socket connection with dev server', err);
  }
}
