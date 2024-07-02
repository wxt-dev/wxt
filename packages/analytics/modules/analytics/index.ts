import 'wxt';
import { addWxtPlugin, defineWxtModule } from 'wxt/modules';
import { resolve } from 'node:path';

const pluginId = process.env.NPM
  ? 'analytics/client'
  : resolve(__dirname, 'client.ts');

export default defineWxtModule({
  name: 'analytics',
  imports: [{ name: 'analytics', from: pluginId }],
  setup(wxt, options) {
    // Add a plugin
    addWxtPlugin(
      wxt,
      resolve(__dirname, process.env.NPM ? 'plugin.mjs' : 'plugin.ts'),
    );
  },
});
