import {
  WxtDevServer,
  Logger,
  TargetBrowser,
  TargetManifestVersion,
  UserManifest,
  ExtensionRunnerConfig,
  ConfigEnv,
  UserConfig,
  WxtBuilder,
} from './external';
import { UnimportOptions } from 'unimport';
import { ResolvedConfig } from 'c12';
import type { Manifest } from 'webextension-polyfill';
import type { PluginVisualizerOptions } from 'rollup-plugin-visualizer';

export interface InternalConfig {
  root: string;
  srcDir: string;
  publicDir: string;
  wxtDir: string;
  typesDir: string;
  entrypointsDir: string;
  outBaseDir: string;
  outDir: string;
  debug: boolean;
  mode: string;
  command: 'build' | 'serve';
  browser: TargetBrowser;
  manifestVersion: TargetManifestVersion;
  env: ConfigEnv;
  logger: Logger;
  imports: false | Partial<UnimportOptions>;
  manifest: UserManifest;
  fsCache: FsCache;
  server?: WxtDevServer;
  runnerConfig: ResolvedConfig<ExtensionRunnerConfig>;
  zip: {
    name?: string;
    artifactTemplate: string;
    sourcesTemplate: string;
    ignoredSources: string[];
    sourcesRoot: string;
  };
  transformManifest: (manifest: Manifest.WebExtensionManifest) => void;
  analysis: {
    enabled: boolean;
    template: NonNullable<PluginVisualizerOptions['template']>;
  };
  userConfigMetadata: Omit<ResolvedConfig<UserConfig>, 'config'>;
  /**
   * Import aliases to absolute paths.
   */
  alias: Record<string, string>;
  experimental: {
    includeBrowserPolyfill: boolean;
  };
  builder: WxtBuilder;
}

export interface FsCache {
  set(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | undefined>;
}

export interface ExtensionRunner {
  openBrowser(config: InternalConfig): Promise<void>;
  closeBrowser(): Promise<void>;
}
