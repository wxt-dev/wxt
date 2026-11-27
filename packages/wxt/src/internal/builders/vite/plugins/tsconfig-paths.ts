import type * as vite from 'vite';

import type { ResolvedConfig } from '../../../../types';

export const tsconfigPaths = (config: ResolvedConfig): vite.Plugin => {
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
};
