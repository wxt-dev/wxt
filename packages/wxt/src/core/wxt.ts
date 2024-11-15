import {
  InlineConfig,
  ResolvedConfig,
  Wxt,
  WxtCommand,
  WxtDevServer,
  WxtHooks,
  WxtModule,
} from '../types';
import { resolveConfig } from './resolve-config';
import { createHooks } from 'hookable';
import { createWxtPackageManager } from './package-managers';
import { createViteBuilder } from './builders/vite';
import { builtinModules } from '../builtin-modules';
import { relative } from 'path';

/**
 * Global variable set once `createWxt` is called once. Since this variable is used everywhere, this
 * global can be used instead of passing the variable as a function parameter everywhere.
 */
export let wxt: Wxt;

/**
 * Create and register a global instance of the Wxt interface for use throughout the project.
 */
export async function registerWxt(
  command: WxtCommand,
  inlineConfig: InlineConfig = {},
  getServer?: (config: ResolvedConfig) => Promise<WxtDevServer>,
): Promise<void> {
  // Default NODE_ENV environment variable before other packages, like vite, do it
  // See https://github.com/wxt-dev/wxt/issues/873#issuecomment-2254555523
  process.env.NODE_ENV ??= command === 'serve' ? 'development' : 'production';

  const hooks = createHooks<WxtHooks>();
  const config = await resolveConfig(inlineConfig, command);
  const server = await getServer?.(config);
  const builder = await createViteBuilder(config, hooks, server);
  const pm = await createWxtPackageManager(config.root);

  wxt = {
    config,
    hooks,
    hook: hooks.hook.bind(hooks),
    get logger() {
      return config.logger;
    },
    async reloadConfig() {
      wxt.config = await resolveConfig(inlineConfig, command);
      await wxt.hooks.callHook('config:resolved', wxt);
    },
    pm,
    builder,
    server,
  };

  // Initialize modules
  const initModule = async (module: WxtModule<any>) => {
    if (module.hooks) wxt.hooks.addHooks(module.hooks);
    await module.setup?.(
      wxt,
      // @ts-expect-error: Untyped configKey field
      module.configKey ? config[module.configKey] : undefined,
    );
  };
  for (const builtinModule of builtinModules) await initModule(builtinModule);
  for (const userModule of config.userModules) await initModule(userModule);

  // Initialize hooks
  wxt.hooks.addHooks(config.hooks);
  if (wxt.config.debug) {
    const order = [
      ...builtinModules.map((module) => module.name),
      ...config.userModules.map((module) =>
        relative(wxt.config.root, module.id),
      ),
      'wxt.config.ts > hooks',
    ];
    wxt.logger.debug('Hook execution order:');
    order.forEach((name, i) => {
      wxt.logger.debug(`  ${i + 1}. ${name}`);
    });
  }

  await wxt.hooks.callHook('config:resolved', wxt);
  await wxt.hooks.callHook('config:resolved', wxt);
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
