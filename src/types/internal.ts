import * as vite from 'vite';
import {
  Entrypoint,
  WxtDevServer,
  Logger,
  TargetBrowser,
  TargetManifestVersion,
  UserManifest,
} from './external';
import { UnimportOptions } from 'unimport';

export interface InternalConfig {
  root: string;
  srcDir: string;
  publicDir: string;
  wxtDir: string;
  typesDir: string;
  entrypointsDir: string;
  outBaseDir: string;
  outDir: string;
  storeIds: {
    chrome?: string;
    firefox?: string;
    edge?: string;
  };
  mode: string;
  command: 'build' | 'serve';
  browser: TargetBrowser;
  manifestVersion: TargetManifestVersion;
  logger: Logger;
  imports: Partial<UnimportOptions>;
  vite: vite.InlineConfig;
  manifest: UserManifest;
  fsCache: FsCache;
  server?: WxtDevServer;
}

export type EntrypointGroup = Entrypoint | Entrypoint[];

export interface FsCache {
  set(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | undefined>;
}
