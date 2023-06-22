import * as vite from 'vite';
import {
  Entrypoint,
  Logger,
  TargetBrowser,
  TargetManifestVersion,
  UserManifest,
} from './external';

export interface InternalConfig {
  root: string;
  srcDir: string;
  entrypointsDir: string;
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
  vite: vite.InlineConfig;
  manifest: UserManifest;
}

export type EntrypointGroup = Entrypoint | Entrypoint[];
