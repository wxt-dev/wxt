import { ResolvedConfig, Wxt } from '~/types';

/**
 * Global variable set once `createWxt` is called once. Since this variable is used everywhere, this
 * global can be used instead of passing the variable as a function parameter everywhere.
 */
export let wxt: Wxt;

/**
 * Create and register a global instance of the Wxt interface for use throughout the project.
 */
export async function registerWxt(config: ResolvedConfig): Promise<void> {
  if (wxt != null) throw Error('Cannot create second instance of Wxt');

  wxt = {
    config,
    get logger() {
      return config.logger;
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
