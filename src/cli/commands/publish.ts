import { consola } from 'consola';
import { defineCommand } from '../utils/defineCommand';

export const publish = defineCommand(
  async (
    root: any,
    { config: configFile, debug }: { config?: string; debug?: string },
  ) => {
    consola.warn('wxt publish: Not implemented');
  },
);
