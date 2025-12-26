import { logger } from '../utils/internal/logger';
import { getDevServerWebSocket } from '../utils/internal/dev-server-websocket';

if (import.meta.env.COMMAND === 'serve') {
  try {
    const ws = getDevServerWebSocket();

    ws.addWxtEventListener('wxt:reload-page', (event) => {
      if (event.detail === location.pathname.substring(1)) location.reload();
    });
  } catch (err) {
    logger.error('Failed to setup web socket connection with dev server', err);
  }
}
