import { Plugin } from 'vite';
import { InternalConfig } from '../types';

/**
 * Defines global constants about the dev server. Helps scripts connect to the server's web socket.
 */
export function devServerGlobals(internalConfig: InternalConfig): Plugin {
  return {
    name: 'wxt:dev-server-globals',
    config(config) {
      if (internalConfig.server == null || internalConfig.command == 'build')
        return;

      config.define ??= {};
      config.define.__DEV_SERVER_PROTOCOL__ = JSON.stringify('ws:');
      config.define.__DEV_SERVER_HOSTNAME__ = JSON.stringify(
        internalConfig.server.hostname,
      );
      config.define.__DEV_SERVER_PORT__ = JSON.stringify(
        internalConfig.server.port,
      );
    },
  };
}
