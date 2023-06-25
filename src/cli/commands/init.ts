import { consola } from 'consola';
import { defineCommand } from '../utils/defineCommand';

export const init = defineCommand<[directory?: string]>(async (directory) => {
  consola.warn('wxt init: Not implemented');
});
