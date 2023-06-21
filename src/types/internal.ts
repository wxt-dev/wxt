import * as vite from 'vite';
import { Logger, TargetBrowser, TargetManifestVersion } from './external';

export interface InternalConfig {
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
  vite?: vite.InlineConfig;
}
