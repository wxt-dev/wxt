import { InlineConfig, Wxt, WxtDevServer, WxtHooks } from '~/types';
import { resolveConfig } from './utils/building';
import { createHooks } from 'hookable';

/**
 * Global variable set once `createWxt` is called once. Since this variable is used everywhere, this
 * global can be used instead of passing the variable as a function parameter everywhere.
 */
export let wxt: Wxt;

/**
 * Create and register a global instance of the Wxt interface for use throughout the project.
 */
export async function registerWxt(
  command: 'build' | 'serve',
  inlineConfig: InlineConfig = {},
  server?: WxtDevServer,
): Promise<void> {
  const config = await resolveConfig(inlineConfig, command, server);

  const hooks = createHooks<WxtHooks>();
  wxt = {
    config,
    hooks,
    get logger() {
      return config.logger;
    },
    async reloadConfig() {
      wxt.config = await resolveConfig(inlineConfig, command, server);
    },
  };

  wxt.hooks.addHooks(config.hooks);
  await wxt.hooks.callHook('ready', wxt);
}

/**
 * @internal ONLY USE FOR TESTING.
 *
 * @example
 * setWxtForTesting(fakeWxt({ ... }));
 * // Or use the shorthand
 * setFakeWxt({ ... })
 */
export function setWxtForTesting(testInstance: Wxt) {
  wxt = testInstance;
}
