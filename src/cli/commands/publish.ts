import { consola } from 'consola';
import { defineCommand } from '../utils/defineCommand';

export const publish = defineCommand(async (root: any, { config }: any) => {
  consola.warn('exvite publish: Not implemented');
});
