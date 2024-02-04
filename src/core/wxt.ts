import { InlineConfig, Wxt, WxtDevServer } from '~/types';
import { resolveConfig } from './utils/building';

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
  if (wxt != null) throw Error('Cannot register second instance of Wxt');

  const config = await resolveConfig(inlineConfig, command, server);

  wxt = {
    config,
    get logger() {
      return config.logger;
    },
    async reloadConfig() {
      wxt.config = await resolveConfig(inlineConfig, command, server);
    },
  };
}

/**
 * @internal ONLY USE FOR TESTING.
 *
 * @example
 * setWxtForTesting(fakeWxt());
 */
export function setWxtForTesting(testInstance: Wxt) {
  wxt = testInstance;
}
