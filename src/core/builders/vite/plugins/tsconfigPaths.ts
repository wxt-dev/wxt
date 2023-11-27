import { InternalConfig } from '~/types';
import * as vite from 'vite';

export function tsconfigPaths(
  config: Omit<InternalConfig, 'builder'>,
): vite.Plugin {
  return {
    name: 'wxt:aliases',
    async config() {
      return {
        resolve: {
          alias: config.alias,
        },
      };
    },
  };
}
