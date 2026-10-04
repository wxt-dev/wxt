import { ResolvedConfig } from '../../../../types';
import type * as vite from 'vite';

export function tsconfigPaths(config: ResolvedConfig): vite.Plugin {
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
