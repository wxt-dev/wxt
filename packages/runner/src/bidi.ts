import { openWebSocket } from './web-socket';
import { debug } from './debug';

const debugBidi = debug.scoped('bidi');

export interface BidiConnection {
  send<T>(method: string, params: any, timeout?: number): Promise<T>;
  close(): void;
}

export async function createBidiConnection(
  baseUrl: string,
): Promise<BidiConnection> {
  const url = new URL('/session', baseUrl);
  debugBidi('Connecting to BiDi server @', url.href);

  const webSocket = await openWebSocket(url.href);
  debugBidi('Connected');

  let requestId = 0;

  return {
    send(method, params, timeout = 10e3) {
      const id = ++requestId;
      const command = { id, method, params };
      debugBidi('Sending command:', command);

      return new Promise((resolve, reject) => {
        const cleanup = () => {
          webSocket.removeEventListener('message', onMessage);
          webSocket.removeEventListener('error', onError);
        };

        setTimeout(() => {
          cleanup();
          reject(
            new Error(
              `Timed out after ${timeout}ms waiting for ${method} response`,
            ),
          );
        }, timeout);

        const onMessage = (event: MessageEvent) => {
          const data = JSON.parse(event.data);
          if (data.id === id) {
            debugBidi('Received response:', data);
            cleanup();
            if (data.type === 'success') resolve(data.result);
            else reject(Error(data.message, { cause: data }));
          }
        };
        const onError = (error: any) => {
          cleanup();
          reject(new Error('Error sending request', { cause: error }));
        };

        webSocket.addEventListener('message', onMessage);
        webSocket.addEventListener('error', onError);

        webSocket.send(JSON.stringify(command));
      });
    },

    close() {
      debugBidi('Closing connection...');
      webSocket.close();
      debugBidi('Closed connection');
    },
    [Symbol.dispose]() {
      debugBidi('Disposing connection...');
      webSocket.close();
      debugBidi('Disposed connection');
    },
  };
}
