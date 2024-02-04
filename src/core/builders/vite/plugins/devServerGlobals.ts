import { Plugin } from 'vite';
import { ResolvedConfig } from '~/types';

/**
 * Defines global constants about the dev server. Helps scripts connect to the server's web socket.
 */
export function devServerGlobals(
  config: Omit<ResolvedConfig, 'builder'>,
): Plugin {
  return {
    name: 'wxt:dev-server-globals',
    config() {
      if (config.server == null || config.command == 'build') return;

      return {
        define: {
          __DEV_SERVER_PROTOCOL__: JSON.stringify('ws:'),
          __DEV_SERVER_HOSTNAME__: JSON.stringify(config.server.hostname),
          __DEV_SERVER_PORT__: JSON.stringify(config.server.port),
        },
      };
    },
  };
}
