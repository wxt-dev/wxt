import { Plugin } from 'vite';
import { ResolvedConfig, WxtDevServer } from '../../../../types';

/**
 * Defines global constants about the dev server. Helps scripts connect to the server's web socket.
 */
export function devServerGlobals(
  config: ResolvedConfig,
  server: WxtDevServer | undefined,
): Plugin {
  return {
    name: 'wxt:dev-server-globals',
    config() {
      if (server == null || config.command == 'build')
        return {
          define: {
            __WXT_BACKGROUND_CLIENT_IMPORT__: '',
          },
        };

      const wxtBackgroundClientUrl = `http://${server.hostname}:${server.port}/@id/wxt/background-client`;
      console.log({ wxtBackgroundClientUrl });

      return {
        define: {
          __WXT_BACKGROUND_CLIENT_IMPORT__: JSON.stringify(
            config.manifestVersion === 2
              ? `import(/* @vite-ignore */ "${wxtBackgroundClientUrl}")`
              : `/* @vite-ignore */\nimport "${wxtBackgroundClientUrl}"`,
          ),
          __DEV_SERVER_PROTOCOL__: JSON.stringify('ws:'),
          __DEV_SERVER_HOSTNAME__: JSON.stringify(server.hostname),
          __DEV_SERVER_PORT__: JSON.stringify(server.port),
        },
      };
    },
  };
}
