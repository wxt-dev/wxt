import type * as vite from 'vite';
import type { Manifest, Scripting } from '~/browser';
import { UnimportOptions } from 'unimport';
import { LogLevel } from 'consola';
import { ContentScriptContext } from '../client/content-scripts/content-script-context';
import type { PluginVisualizerOptions } from 'rollup-plugin-visualizer';
import type { FSWatcher } from 'chokidar';

export interface InlineConfig {
  /**
   * Your project's root directory containing the `package.json` used to fill out the
   * `manifest.json`.
   *
   * @default process.cwd()
   */
  root?: string;
  /**
   * Directory containing all source code. Set to `"src"` to move all source code to a `src/`
   * directory.
   *
   * @default config.root
   */
  srcDir?: string;
  /**
   * Directory containing files that will be copied to the output directory as-is.
   *
   * @default "${config.root}/public"
   */
  publicDir?: string;
  /**
   * @default "${config.srcDir}/entrypoints"
   */
  entrypointsDir?: string;
  /**
   * A list of entrypoint names (`"popup"`, `"options"`, etc.) to build. Will speed up the build if
   * your extension has lots of entrypoints, and you don't need to build all of them to develop a
   * feature.
   */
  filterEntrypoints?: string[];
  /**
   * Output directory that stored build folders and ZIPs.
   *
   * @default ".output"
   */
  outDir?: string;
  /**
   * > Only available when using the JS API. Not available in `wxt.config.ts` files
   *
   * Path to `wxt.config.ts` file or `false` to disable config file discovery.
   *
   * @default "wxt.config.ts"
   */
  configFile?: string | false;
  /**
   * Set to `true` to show debug logs. Overriden by the command line `--debug` option.
   *
   * @default false
   */
  debug?: boolean;
  /**
   * Explicitly set a mode to run in. This will override the default mode for each command, and can
   * be overridden by the command line `--mode` option.
   */
  mode?: string;
  /**
   * Customize auto-import options. Set to `false` to disable auto-imports.
   *
   * For example, to add a directory to auto-import from, you can use:
   *
   * ```ts
   * export default defineConfig({
   *   imports: {
   *     dirs: ["some-directory"]
   *   }
   * })
   * ```
   */
  imports?: Partial<UnimportOptions> | false;
  /**
   * Explicitly set a browser to build for. This will override the default browser for each command,
   * and can be overridden by the command line `--browser` option.
   *
   * @default
   * "chrome"
   */
  browser?: TargetBrowser;
  /**
   * Explicitly set a manifest version to target. This will override the default manifest version
   * for each command, and can be overridden by the command line `--mv2` or `--mv3` option.
   */
  manifestVersion?: TargetManifestVersion;
  /**
   * Override the logger used.
   *
   * @default
   * consola
   */
  logger?: Logger;
  /**
   * Customize the `manifest.json` output. Can be an object, promise, or function that returns an
   * object or promise.
   */
  manifest?: UserManifest | Promise<UserManifest> | UserManifestFn;
  /**
   * Custom runner options. Options set here can be overridden in a `web-ext.config.ts` file.
   */
  runner?: ExtensionRunnerConfig;
  zip?: {
    /**
     * Configure the filename output when zipping files.
     *
     * Available template variables:
     *
     * - `{{name}}` - The project's name converted to kebab-case
     * - `{{version}}` - The version_name or version from the manifest
     * - `{{browser}}` - The target browser from the `--browser` CLI flag
     * - `{{manifestVersion}}` - Either "2" or "3"
     *
     * @default "{{name}}-{{version}}-{{browser}}.zip"
     */
    artifactTemplate?: string;
    /**
     * Configure the filename output when zipping files.
     *
     * Available template variables:
     *
     * - `{{name}}` - The project's name converted to kebab-case
     * - `{{version}}` - The version_name or version from the manifest
     * - `{{browser}}` - The target browser from the `--browser` CLI flag
     * - `{{manifestVersion}}` - Either "2" or "3"
     *
     * @default "{{name}}-{{version}}-sources.zip"
     */
    sourcesTemplate?: string;
    /**
     * Override the artifactTemplate's `{name}` template variable. Defaults to the `package.json`'s
     * name, or if that doesn't exist, the current working directories name.
     */
    name?: string;
    /**
     * Root directory to ZIP when generating the sources ZIP.
     *
     * @default config.root
     */
    sourcesRoot?: string;
    /**
     * [Minimatch](https://www.npmjs.com/package/minimatch) patterns of files to exclude when
     * creating a ZIP of all your source code for Firfox. Patterns are relative to your
     * `config.zip.sourcesRoot`.
     *
     * Hidden files, node_modules, and tests are ignored by default.
     *
     * @example
     * [
     *   "coverage", // Ignore the coverage directory in the `sourcesRoot`
     * ]
     */
    ignoredSources?: string[];
  };

  /**
   * Transform the final manifest before it's written to the file system. Edit the `manifest`
   * parameter directly, do not return a new object. Return values are ignored.
   *
   * @example
   * defineConfig({
   *   // Add a CSS-only content script.
   *   transformManifest(manifest) {
   *     manifest.content_scripts.push({
   *       matches: ["*://google.com/*"],
   *       css: ["content-scripts/some-example.css"],
   *     });
   *   }
   * })
   */
  transformManifest?: (manifest: Manifest.WebExtensionManifest) => void;
  analysis?: {
    /**
     * Explicitly include bundle analysis when running `wxt build`. This can be overridden by the
     * command line `--analysis` option.
     *
     * @default false
     */
    enabled?: boolean;
    /**
     * When running `wxt build --analyze` or setting `analysis.enabled` to true, customize how the
     * bundle will be visualized. See
     * [`rollup-plugin-visualizer`](https://github.com/btd/rollup-plugin-visualizer#how-to-use-generated-files)
     * for more details.
     *
     * @default "treemap"
     */
    template?: PluginVisualizerOptions['template'];
  };
  /**
   * Add additional paths to the `.wxt/tsconfig.json`. Use this instead of overwriting the `paths`
   * in the root `tsconfig.json` if you want to add new paths.
   *
   * The key is the import alias and the value is either a relative path to the root directory or an absolute path.
   *
   * @example
   * {
   *   "testing": "src/utils/testing.ts"
   * }
   */
  alias?: Record<string, string>;
  /**
   * Experimental settings - use with caution.
   */
  experimental?: {
    /**
     * Whether to use [`webextension-polyfill`](https://www.npmjs.com/package/webextension-polyfill)
     * when importing `browser` from `wxt/browser`.
     *
     * When set to `false`, WXT will export the chrome global instead of the polyfill from
     * `wxt/browser`.
     *
     * You should use `browser` to access the web extension APIs.
     *
     * @experimental This option will remain experimental until Manifest V2 is dead.
     *
     * @default true
     * @example
     * export default defineConfig({
     *   experimental: {
     *     includeBrowserPolyfill: false
     *   }
     * })
     */
    includeBrowserPolyfill?: boolean;
  };
}

// TODO: Extract to @wxt/vite-builder and use module augmentation to include the vite field
export interface InlineConfig {
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

// TODO: Move into @wxt/vite-builder
export type WxtViteConfig = Omit<
  vite.UserConfig,
  'root' | 'configFile' | 'mode'
>;

export interface BuildOutput {
  manifest: Manifest.WebExtensionManifest;
  publicAssets: OutputAsset[];
  steps: BuildStepOutput[];
}

export type OutputFile = OutputChunk | OutputAsset;

export interface OutputChunk {
  type: 'chunk';
  /**
   * Relative, normalized path relative to the output directory.
   *
   * Ex: "content-scripts/overlay.js"
   */
  fileName: string;
  /**
   * Absolute, normalized paths to all dependencies this chunk relies on.
   */
  moduleIds: string[];
}

export interface OutputAsset {
  type: 'asset';
  /**
   * Relative, normalized path relative to the output directory.
   *
   * Ex: "icons/16.png"
   */
  fileName: string;
}

export interface BuildStepOutput {
  entrypoints: EntrypointGroup;
  chunks: OutputFile[];
}

export interface WxtDevServer
  extends Omit<WxtBuilderServer, 'listen'>,
    ServerInfo {
  /**
   * Stores the current build output of the server.
   */
  currentOutput: BuildOutput;
  /**
   * Start the server.
   */
  start(): Promise<void>;
  /**
   * Transform the HTML for dev mode.
   */
  transformHtml(
    url: string,
    html: string,
    originalUrl?: string | undefined,
  ): Promise<string>;
  /**
   * Tell the extension to reload by running `browser.runtime.reload`.
   */
  reloadExtension: () => void;
  /**
   * Tell an extension page to reload.
   *
   * The path is the bundle path, not the input paths, so if the input paths is
   * "src/options/index.html", you would pass "options.html" because that's where it is written to
   * in the dist directory, and where it's available at in the actual extension.
   *
   * @example
   * server.reloadPage("popup.html")
   * server.reloadPage("sandbox.html")
   */
  reloadPage: (path: string) => void;
  /**
   * Tell the extension to restart a content script.
   *
   * @param contentScript The manifest definition for a content script
   */
  reloadContentScript: (
    contentScript: Omit<Scripting.RegisteredContentScript, 'id'>,
  ) => void;
}

export type TargetBrowser = string;
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
  level: LogLevel;
}

export interface BaseEntrypointOptions {
  include?: TargetBrowser[];
  exclude?: TargetBrowser[];
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
   * - `sandbox/index.html` &rarr; `sandbox`
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
  options: BaseEntrypointOptions;
  skipped: boolean;
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
    | 'unlisted-script'
    | 'unlisted-style'
    | 'content-script-style';
}

export interface BackgroundEntrypoint extends BaseEntrypoint {
  type: 'background';
  options: {
    persistent?: boolean;
    type?: 'module';
  } & BaseEntrypointOptions;
}

export interface ContentScriptEntrypoint extends BaseEntrypoint {
  type: 'content-script';
  options: Omit<ContentScriptDefinition, 'main'> & BaseEntrypointOptions;
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
    browserStyle?: boolean;
  } & BaseEntrypointOptions;
}

export interface OptionsEntrypoint extends BaseEntrypoint {
  type: 'options';
  options: {
    openInTab?: boolean;
    browserStyle?: boolean;
    chromeStyle?: boolean;
  } & BaseEntrypointOptions;
}

export type Entrypoint =
  | GenericEntrypoint
  | BackgroundEntrypoint
  | ContentScriptEntrypoint
  | PopupEntrypoint
  | OptionsEntrypoint;

export type EntrypointGroup = Entrypoint | Entrypoint[];

export type OnContentScriptStopped = (cb: () => void) => void;

export type ContentScriptDefinition =
  | ContentScriptIsolatedWorldDefinition
  | ContentScriptMainWorldDefinition;

export interface ContentScriptIsolatedWorldDefinition
  extends ContentScriptBaseDefinition {
  /**
   * See https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#isolated_world
   * @default "ISOLATED"
   */
  world?: 'ISOLATED';
  /**
   * Main function executed when the content script is loaded.
   */
  main(ctx: ContentScriptContext): void | Promise<void>;
}

export interface ContentScriptMainWorldDefinition
  extends ContentScriptBaseDefinition {
  /**
   * See https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#isolated_world
   */
  world: 'MAIN';
  /**
   * Main function executed when the content script is loaded.
   */
  main(): void | Promise<void>;
}

export interface ContentScriptBaseDefinition extends ExcludableEntrypoint {
  matches: PerBrowserOption<Manifest.ContentScript['matches']>;
  /**
   * See https://developer.chrome.com/docs/extensions/mv3/content_scripts/
   * @default "documentIdle"
   */
  runAt?: PerBrowserOption<Manifest.ContentScript['run_at']>;
  /**
   * See https://developer.chrome.com/docs/extensions/mv3/content_scripts/
   * @default false
   */
  matchAboutBlank?: PerBrowserOption<
    Manifest.ContentScript['match_about_blank']
  >;
  /**
   * See https://developer.chrome.com/docs/extensions/mv3/content_scripts/
   * @default []
   */
  excludeMatches?: PerBrowserOption<Manifest.ContentScript['exclude_matches']>;
  /**
   * See https://developer.chrome.com/docs/extensions/mv3/content_scripts/
   * @default []
   */
  includeGlobs?: PerBrowserOption<Manifest.ContentScript['include_globs']>;
  /**
   * See https://developer.chrome.com/docs/extensions/mv3/content_scripts/
   * @default []
   */
  excludeGlobs?: PerBrowserOption<Manifest.ContentScript['exclude_globs']>;
  /**
   * See https://developer.chrome.com/docs/extensions/mv3/content_scripts/
   * @default false
   */
  allFrames?: PerBrowserOption<Manifest.ContentScript['all_frames']>;
  /**
   * See https://developer.chrome.com/docs/extensions/mv3/content_scripts/
   * @default false
   */
  matchOriginAsFallback?: PerBrowserOption<boolean>;
  /**
   * Customize how imported/generated styles are injected with the content script. Regardless of the
   * mode selected, CSS will always be built and included in the output directory.
   *
   * - `"manifest"` - Include the CSS in the manifest, under the content script's `css` array.
   * - `"manual"` - Exclude the CSS from the manifest. You are responsible for manually loading it
   *   onto the page. Use `browser.runtime.getURL("content-scripts/<name>.css")` to get the file's
   *   URL
   * - `"ui"` - Exclude the CSS from the manifest. CSS will be automatically added to your UI when
   *   calling `createContentScriptUi`
   *
   * @default "manifest"
   */
  cssInjectionMode?: PerBrowserOption<'manifest' | 'manual' | 'ui'>;
}

export interface BackgroundDefinition extends ExcludableEntrypoint {
  type?: PerBrowserOption<'module'>;
  persistent?: PerBrowserOption<boolean>;
  main(): void;
}

export interface UnlistedScriptDefinition extends ExcludableEntrypoint {
  /**
   * Main function executed when the unlisted script is ran.
   */
  main(): void | Promise<void>;
}

export type PerBrowserOption<T> = T | { [browser: TargetBrowser]: T };

export interface ExcludableEntrypoint {
  /**
   * List of target browsers to include this entrypoint in. Defaults to being included in all
   * builds. Cannot be used with `exclude`. You must choose one of the two options.
   *
   * @default undefined
   */
  include?: TargetBrowser[];
  /**
   * List of target browsers to exclude this entrypoint from. Cannot be used with `include`. You
   * must choose one of the two options.
   *
   * @default undefined
   */
  exclude?: TargetBrowser[];
}

/**
 * Manifest customization available in the `wxt.config.ts` file. You cannot configure entrypoints
 * here, they are configured inline.
 */
export type UserManifest = Partial<
  Omit<
    Manifest.WebExtensionManifest,
    | 'background'
    | 'chrome_url_overrides'
    | 'devtools_page'
    | 'manifest_version'
    | 'options_page'
    | 'options_ui'
    | 'sandbox'
    | 'sidepanel'
    | 'sidebar_action'
  >
>;

export type UserManifestFn = (
  env: ConfigEnv,
) => UserManifest | Promise<UserManifest>;

export interface ConfigEnv {
  mode: string;
  command: 'build' | 'serve';
  /**
   * Browser passed in from the CLI
   */
  browser: TargetBrowser;
  /**
   * Manifest version passed in from the CLI
   */
  manifestVersion: 2 | 3;
}

/**
 * Configure how the browser starts up.
 */
export interface ExtensionRunnerConfig {
  /**
   * Whether or not to open the browser with the extension installed in dev mode.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#browser-console
   */
  openConsole?: boolean;
  /**
   * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#devtools
   */
  openDevtools?: boolean;
  /**
   * List of browser names and the binary that should be used to open the browser.
   *
   * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#chromium-binary
   * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#firefox
   */
  binaries?: Record<string, string>;
  /**
   * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#firefox-profile
   */
  firefoxProfile?: string;
  /**
   * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#chromium-profile
   */
  chromiumProfile?: string;
  /**
   * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#pref
   */
  firefoxPrefs?: Record<string, string>;
  /**
   * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#args
   */
  firefoxArgs?: string[];
  /**
   * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#args
   */
  chromiumArgs?: string[];
  /**
   * @see https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#start-url
   */
  startUrls?: string[];
}

export interface WxtBuilder {
  /**
   * Name of tool used to build. Ex: "Vite" or "Webpack".
   */
  name: string;
  /**
   * Version of tool used to build. Ex: "5.0.2"
   */
  version: string;
  /**
   * Build a single entrypoint group. This is effectively one of the multiple "steps" during the
   * build process.
   */
  build(group: EntrypointGroup): Promise<BuildStepOutput>;
  /**
   * Start a dev server at the provided port.
   */
  createServer(info: ServerInfo): Promise<WxtBuilderServer>;
}

export interface WxtBuilderServer {
  /**
   * Start the server.
   */
  listen(): Promise<void>;
  /**
   * Transform the HTML for dev mode.
   */
  transformHtml(
    url: string,
    html: string,
    originalUrl?: string | undefined,
  ): Promise<string>;
  /**
   * The web socket server used to communicate with the extension.
   */
  ws: {
    /**
     * Send a message via the server's websocket, with an optional payload.
     *
     * @example
     * ws.send("wxt:reload-extension");
     * ws.send("wxt:reload-content-script", { ... });
     */
    send(message: string, payload?: any): void;
    /**
     * Listen for messages over the server's websocket.
     */
    on(message: string, cb: (payload: any) => void): void;
  };
  /**
   * Chokidar file watcher instance.
   */
  watcher: FSWatcher;
}

export interface ServerInfo {
  /**
   * Ex: `3000`
   */
  port: number;
  /**
   * Ex: `"localhost"`
   */
  hostname: string;
  /**
   * Ex: `"http://localhost:3000"`
   */
  origin: string;
}
