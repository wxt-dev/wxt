import * as vite from 'vite';
import { Manifest } from 'webextension-polyfill';
import { UnimportOptions } from 'unimport';

export interface InlineConfig {
  root?: string;
  srcDir?: string;
  publicDir?: string;
  entrypointsDir?: string;
  configFile?: string | false;
  storeIds?: {
    chrome?: string;
    firefox?: string;
    edge?: string;
  };
  mode?: string;
  imports?: Partial<UnimportOptions>;
  browser?: TargetBrowser;
  manifestVersion?: TargetManifestVersion;
  logger?: Logger;
  vite?: Omit<vite.InlineConfig, 'root' | 'configFile' | 'mode'>;
  manifest?: UserManifest;
  server?: WxtDevServer;
}

export interface WxtInlineViteConfig
  extends Omit<vite.InlineConfig, 'root' | 'configFile' | 'mode' | 'build'> {
  build?: Omit<vite.BuildOptions, 'outDir'>;
}

export type BuildOutput = (vite.Rollup.OutputChunk | vite.Rollup.OutputAsset)[];

export interface WxtDevServer extends vite.ViteDevServer {
  logger: Logger;
  port: number;
  hostname: string;
  origin: string;
}

export type TargetBrowser = 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera';
export type TargetManifestVersion = 2 | 3;

export type UserConfig = Omit<InlineConfig, 'configFile'>;

export interface Logger {
  debug(...args: any[]): void;
  log(...args: any[]): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
  fatal(...args: any[]): void;
  success(...args: any[]): void;
}

export interface BaseEntrypoint {
  /**
   * The entrypoint's name. This is the filename or dirname without the type suffix.
   *
   * Examples:
   * - `popup.html` &rarr; `popup`
   * - `options/index.html` &rarr; `options`
   * - `named.sandbox.html` &rarr; `named`
   * - `named.sandbox/index.html` &rarr; `named`
   * - `sandbox.html` &rarr; `sandbox`
   * - `sandbox.index.html` &rarr; `sandbox`
   * - `overlay.content.ts` &rarr; `overlay`
   * - `overlay.content/index.ts` &rarr; `overlay`
   *
   * The name is used when generating an output file:
   * `<entrypoint.outputDir>/<entrypoint.name>.<ext>`
   */
  name: string;
  /**
   * Absolute path to the entrypoint's input file.
   */
  inputPath: string;
  /**
   * Absolute path to the entrypoint's output directory. Can be the`InternalConfg.outDir` or a
   * subdirectory of it.
   */
  outputDir: string;
}

export interface GenericEntrypoint extends BaseEntrypoint {
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
}

export interface BackgroundEntrypoint extends BaseEntrypoint {
  type: 'background';
  options: {
    persistent?: boolean;
    type?: 'module';
  };
}

export interface ContentScriptEntrypoint extends BaseEntrypoint {
  type: 'content-script';
  options: Omit<ContentScriptDefinition, 'main'>;
}

export interface PopupEntrypoint extends BaseEntrypoint {
  type: 'popup';
  options: {
    /**
     * Defaults to "browser_action" to be equivalent to MV3's "action" key
     */
    mv2Key?: 'browser_action' | 'page_action';
    defaultIcon?: Record<string, string>;
    defaultTitle?: string;
  };
}

export interface OptionsEntrypoint extends BaseEntrypoint {
  type: 'options';
  options: {
    openInTab?: boolean;
    browserStyle?: boolean;
    chromeStyle?: boolean;
  };
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

/**
 * Manifest customization available in the `wxt.config.ts` file. Any missing fields like "name"
 * and "version" are managed automatically, and don't need to be listed here.
 */
export type UserManifest = Omit<
  Manifest.WebExtensionManifest,
  | 'action'
  | 'background'
  | 'browser_action'
  | 'chrome_url_overrides'
  | 'content_scripts'
  | 'description'
  | 'devtools_page'
  | 'manifest_version'
  | 'name'
  | 'options_page'
  | 'options_ui'
  | 'sandbox'
  | 'page_action'
  | 'popup'
  | 'short_name'
  | 'sidepanel'
  | 'sidebar_action'
  | 'version'
  | 'version_name'
>;
