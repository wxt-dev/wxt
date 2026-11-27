import type * as vite from 'vite';

import { ResolvedConfig } from '../../../../types';

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
