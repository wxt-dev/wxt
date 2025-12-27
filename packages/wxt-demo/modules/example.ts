import { defineWxtModule } from 'wxt/modules';

export default defineWxtModule({
  configKey: 'example',
  setup(wxt, options) {
    wxt.logger.info('Example module with options:', options);
  },
});
