import { defineWxtModule } from 'wxt/modules';

export default defineWxtModule((_, wxt) => {
  wxt.logger.info('TEST MODULE');
});
