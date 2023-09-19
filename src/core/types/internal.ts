import * as vite from 'vite';
import {
  Entrypoint,
  WxtDevServer,
  Logger,
  TargetBrowser,
  TargetManifestVersion,
  UserManifest,
  ExtensionRunnerConfig,
} from './external';
import { UnimportOptions } from 'unimport';
import { ResolvedConfig } from 'c12';

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
  logger: Logger;
  imports: false | Partial<UnimportOptions>;
  vite: vite.InlineConfig;
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
}

export type EntrypointGroup = Entrypoint | Entrypoint[];

export interface FsCache {
  set(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | undefined>;
}
