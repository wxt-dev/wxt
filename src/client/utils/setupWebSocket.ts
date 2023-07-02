import { logger } from './logger';
import browser from 'webextension-polyfill';

export function setupWebSocket() {
  const serverUrl = `${__DEV_SERVER_PROTOCOL__}//${__DEV_SERVER_HOSTNAME__}:${__DEV_SERVER_PORT__}`;
  logger.debug('Connecting to dev server @', serverUrl);
  const ws = new WebSocket(serverUrl, 'vite-hmr');

  ws.addEventListener('open', () => {
    logger.debug('Connected to dev server');
  });

  ws.addEventListener('close', () => {
    logger.debug('Disconnected from dev server');
  });

  ws.addEventListener('error', (event) => {
    logger.error('Failed to connect to dev server', event);
  });

  ws.addEventListener('message', (e) => {
    try {
      const { type, event, data } = JSON.parse(e.data) as {
        type: 'custom';
        event: string;
        data: any;
      };
      if (type === 'custom' && event?.startsWith?.('wxt:')) {
        logger.debug(`Recieved message: ${event}`, data);
        switch (event) {
          case 'wxt:reload-extension':
            browser.runtime.reload();
            break;
        }
      }
    } catch (err) {
      logger.error('Failed to handle message', err);
    }
  });
}
