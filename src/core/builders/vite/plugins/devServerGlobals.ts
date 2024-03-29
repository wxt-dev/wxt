import { Plugin } from 'vite';
import { ResolvedConfig, WxtDevServer } from '~/types';

/**
 * Defines global constants about the dev server. Helps scripts connect to the server's web socket.
 */
export function devServerGlobals(
  config: Omit<ResolvedConfig, 'builder'>,
  server: WxtDevServer | undefined,
): Plugin {
  return {
    name: 'wxt:dev-server-globals',
    config() {
      if (server == null || config.command == 'build') return;

      return {
        define: {
          __DEV_SERVER_PROTOCOL__: JSON.stringify('ws:'),
          __DEV_SERVER_HOSTNAME__: JSON.stringify(server.hostname),
          __DEV_SERVER_PORT__: JSON.stringify(server.port),
        },
      };
    },
  };
}
