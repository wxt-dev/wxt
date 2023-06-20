import * as vite from 'vite';
import { UnimportPluginOptions } from 'unimport/unplugin';

export interface InlineConfig {
  root?: string;
  srcDir?: string;
  configFile?: string | false;
  storeIds?: {
    chrome?: string;
    firefox?: string;
    edge?: string;
  };
  mode?: string;
  imports?: Partial<UnimportPluginOptions>;
  browser?: TargetBrowser;
  logger?: Logger;
  vite?: Omit<vite.InlineConfig, 'root' | 'configFile' | 'mode'>;
}

export interface BuildOutput {}

export interface ExviteDevServer {}

export type TargetBrowser = 'chromium' | 'firefox';

export type UserConfig = Omit<InlineConfig, 'configFile'>;

export type UserConfigExport =
  | UserConfig
  | ((info: { mode: string }) => UserConfig)
  | ((info: { mode: string }) => Promise<UserConfig>);

export interface Logger {
  debug(...args: any[]): void;
  log(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  fatal(...args: any[]): void;
}
