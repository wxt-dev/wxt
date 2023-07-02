import { logger } from './logger';

interface WebSocketMessage {
  type: string;
  event: string;
  data?: any;
}

/**
 * Connect to the websocket and listen for messages.
 *
 * @param onMessage Optional callback that is called when a message is recieved and we've verified
 *                  it's structure is what we expect.
 */
export function setupWebSocket(
  onMessage?: (message: WebSocketMessage) => void,
) {
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
      const message = JSON.parse(e.data) as WebSocketMessage;
      if (message.type === 'custom' && message.event?.startsWith?.('wxt:')) {
        logger.debug(`Recieved message: ${message.event}`, message);
        onMessage?.(message);
      }
    } catch (err) {
      logger.error('Failed to handle message', err);
    }
  });

  return ws;
}
