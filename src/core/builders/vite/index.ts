import type * as vite from 'vite';
import {
  ConfigEnv,
  InlineConfig,
  InternalConfig,
  UserConfig,
  WxtBuilder,
} from '~/types';
import * as plugins from './plugins';

export type WxtViteConfig = Omit<
  vite.UserConfig,
  'root' | 'configFile' | 'mode'
>;

declare module '~/types' {
  interface InlineConfig {
    /**
     * Return custom Vite options from a function. See
     * <https://vitejs.dev/config/shared-options.html>.
     *
     * [`root`](#root), [`configFile`](#configfile), and [`mode`](#mode) should be set in WXT's config
     * instead of Vite's.
     *
     * This is a function because any vite plugins added need to be recreated for each individual
     * build step, incase they have internal state causing them to fail when reused.
     */
    vite?: (env: ConfigEnv) => WxtViteConfig | Promise<WxtViteConfig>;
  }
}

export async function craeteViteBuilder(
  inlineConfig: InlineConfig,
  userConfig: UserConfig,
  wxtConfig: Omit<InternalConfig, 'builder'>,
): Promise<WxtBuilder> {
  const vite = await import('vite');

  const getViteConfig = async () => {
    const resolvedInlineConfig =
      (await inlineConfig.vite?.(wxtConfig.env)) ?? {};
    const resolvedUserConfig = (await userConfig.vite?.(wxtConfig.env)) ?? {};

    const config: vite.InlineConfig = vite.mergeConfig(
      resolvedUserConfig,
      resolvedInlineConfig,
    );

    config.root = wxtConfig.root;
    config.configFile = false;
    config.logLevel = 'warn';
    config.mode = wxtConfig.mode;

    config.build ??= {};
    config.build.outDir = wxtConfig.outDir;
    config.build.emptyOutDir = false;

    config.plugins ??= [];
    config.plugins.push(
      plugins.download(wxtConfig),
      plugins.devHtmlPrerender(wxtConfig),
      plugins.unimport(wxtConfig),
      plugins.virtualEntrypoint('background', wxtConfig),
      plugins.virtualEntrypoint('content-script', wxtConfig),
      plugins.virtualEntrypoint('unlisted-script', wxtConfig),
      plugins.devServerGlobals(wxtConfig),
      plugins.tsconfigPaths(wxtConfig),
      plugins.noopBackground(),
      plugins.globals(wxtConfig),
      plugins.excludeBrowserPolyfill(wxtConfig),
    );
    if (wxtConfig.analysis.enabled) {
      config.plugins.push(plugins.bundleAnalysis());
    }

    return config;
  };

  return {
    build(group) {
      throw Error('Not implemented');
    },
    createServer() {
      throw Error('Not implemented');
    },
  };
}
