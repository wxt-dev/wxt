import { addViteConfig, defineWxtModule } from '../../modules';
import type { Entrypoint } from '../../types';
import { resolveVirtualModules } from '../builders/vite/plugins/resolve-virtual-modules';
import { wxtPluginLoader } from '../builders/vite/plugins/wxt-plugin-loader';

/**
 * Owns the virtual `wxt-plugins`/`wxt-html-plugins` modules used by
 * `addWxtPlugin`. Keeps the latest resolved entrypoints in module-local state
 * instead of on the global `wxt` object.
 */
export default defineWxtModule({
  name: 'wxt:built-in:plugins',
  setup(wxt) {
    let entrypoints: Entrypoint[] = [];
    wxt.hooks.hook('entrypoints:resolved', (_, resolved) => {
      entrypoints = resolved;
    });

    addViteConfig(wxt, () => ({
      plugins: [
        resolveVirtualModules(wxt.config),
        wxtPluginLoader(wxt.config, () => entrypoints),
      ],
    }));
  },
});
