import * as vite from 'vite';
import { UnimportPluginOptions } from 'unimport/unplugin';

export interface InlineConfig {
  root?: string;
  srcDir?: string;
  entrypointsDir?: string;
  configFile?: string | false;
  storeIds?: {
    chrome?: string;
    firefox?: string;
    edge?: string;
  };
  mode?: string;
  imports?: Partial<UnimportPluginOptions>;
  browser?: TargetBrowser;
  manifestVersion?: TargetManifestVersion;
  logger?: Logger;
  vite?: Omit<vite.InlineConfig, 'root' | 'configFile' | 'mode'>;
}

export interface ExviteInlineViteConfig
  extends Omit<vite.InlineConfig, 'root' | 'configFile' | 'mode' | 'build'> {
  build?: Omit<vite.BuildOptions, 'outDir'>;
}

export interface BuildOutput {}

export interface ExviteDevServer {}

export type TargetBrowser = 'chromium' | 'firefox';
export type TargetManifestVersion = 2 | 3;

export type UserConfig = Omit<InlineConfig, 'configFile'>;

export interface Logger {
  debug(...args: any[]): void;
  log(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  fatal(...args: any[]): void;
}

export interface GenericEntrypoint {
  type:
    | 'sandbox'
    | 'bookmarks'
    | 'history'
    | 'newtab'
    | 'sidepanel'
    | 'devtools'
    | 'unlisted-page'
    | 'unlisted-page'
    | 'unlisted-script';
  inputPath: string;
  outputDir: string;
}

export interface BackgroundEntrypoint {
  type: 'background';
  options: {};
  inputPath: string;
  outputDir: string;
}

export interface ContentScriptEntrypoint {
  type: 'content-script';
  options: Omit<ContentScriptDefinition, 'main'>;
  inputPath: string;
  outputDir: string;
}

export interface PopupEntrypoint {
  type: 'popup';
  options: {
    defaultIcon?: Record<string, string>;
    defaultTitle?: string;
  };
  inputPath: string;
  outputDir: string;
}

export interface OptionsEntrypoint {
  type: 'options';
  options: {
    openInTab?: boolean;
  };
  inputPath: string;
  outputDir: string;
}

export type Entrypoint =
  | GenericEntrypoint
  | BackgroundEntrypoint
  | ContentScriptEntrypoint
  | PopupEntrypoint
  | OptionsEntrypoint;

export type OnContentScriptStopped = (cb: () => void) => void;

export interface ContentScriptDefinition {
  matches: string[];
  runAt?: 'document_start' | 'document_end' | 'document_idle';
  matchAboutBlank?: boolean;
  matchOriginAsFallback?: boolean;
  world?: 'ISOLATED' | 'MAIN';
  main(onStopped: OnContentScriptStopped): void | Promise<void>;
}

export interface BackgroundScriptDefintition {
  type?: 'module';
  main(): void;
}
