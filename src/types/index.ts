import type * as vite from 'vite';
import type { Manifest, Scripting } from '~/browser';
import { UnimportOptions } from 'unimport';
import { LogLevel } from 'consola';
import { ContentScriptContext } from '../client/content-scripts/content-script-context';
import type { PluginVisualizerOptions } from '@aklinker1/rollup-plugin-visualizer';
import type { FSWatcher } from 'chokidar';
import { ResolvedConfig as C12ResolvedConfig } from 'c12';
import { Hookable, NestedHooks } from 'hookable';
import type * as Nypm from 'nypm';

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
  imports?: WxtUnimportOptions | false;
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
     * [Minimatch](https://www.npmjs.com/package/minimatch) patterns of files to include when
     * creating a ZIP of all your source code for Firefox. Patterns are relative to your
     * `config.zip.sourcesRoot`.
     *
     * This setting overrides `excludeSources`. So if a file matches both lists, it is included in the ZIP.
     *
     * @example
     * [
     *   "coverage", // Ignore the coverage directory in the `sourcesRoot`
     * ]
     */
    includeSources?: string[];
    /**
     * [Minimatch](https://www.npmjs.com/package/minimatch) patterns of files to exclude when
     * creating a ZIP of all your source code for Firefox. Patterns are relative to your
     * `config.zip.sourcesRoot`.
     *
     * Hidden files, node_modules, and tests are ignored by default.
     *
     * @example
     * [
     *   "coverage", // Ignore the coverage directory in the `sourcesRoot`
     * ]
     */
    excludeSources?: string[];
    /**
     * The Firefox review process requires the extension be buildable from source to make reviewing
     * easier. This field allows you to use private packages without exposing your auth tokens.
     *
     * Just list the name of all the packages you want to download and include in the sources zip.
     * Usually, these will be private packages behind auth tokens, but they don't have to be.
     *
     * All packages listed here will be downloaded to in `.wxt/local_modules/` and an `overrides` or
     * `resolutions` field (depending on your package manager) will be added to the `package.json`,
     * pointing to the downloaded packages.
     *
     * > ***DO NOT include versions or version filters.*** Just the package name. If multiple
     * > versions of a package are present in the project, all versions will be downloaded and
     * > referenced in the package.json correctly.
     *
     * @default []
     *
     * @example
     * // Correct:
     * ["@scope/package-name", "package-name"]
     *
     * // Incorrect, don't include versions!!!
     * ["@scope/package-name@1.1.3", "package-name@^2"]
     */
    downloadPackages?: string[];
  };

  /**
   * @deprecated Use `hooks.build.manifestGenerated` to modify your manifest instead. This option
   *             will be removed in v1.0
   *
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
    /**
     * Name of the output HTML file. Relative to the project's root directory.
     *
     * Changing the filename of the outputFile also effects the names of the artifacts generated
     * when setting `keepArtifacts` to true:
     * - "stats.html" => "stats-*.json"
     * - "stats/bundle.html" => "bundle-*.json"
     * - ".analysis/index.html" => "index-*.json"
     *
     * @default "stats.html"
     */
    outputFile?: string;
    /**
     * By default, the `stats-*.json` artifacts generated during bundle analysis are deleted. Set to
     * `true` to keep them.
     *
     * One stats file is output per build step.
     *
     * @default false
     */
    keepArtifacts?: boolean;
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
  /**
   * Config effecting dev mode only.
   */
  dev?: {
    /**
     * Controls whether a custom keyboard shortcut command, `Alt+R`, is added during dev mode to
     * quickly reload the extension.
     *
     * If false, the shortcut is not added during development.
     *
     * If set to a custom string, you can override the key combo used. See
     * [Chrome's command docs](https://developer.chrome.com/docs/extensions/reference/api/commands)
     * for available options.
     *
     * @default "Alt+R"
     */
    reloadCommand?: string | false;
  };
  /**
   * Project hooks for running logic during the build process.
   */
  hooks?: NestedHooks<WxtHooks>;
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
  extends Omit<WxtBuilderServer, 'listen' | 'close'>,
    ServerInfo {
  /**
   * Stores the current build output of the server.
   */
  currentOutput: BuildOutput | undefined;
  /**
   * Start the server.
   */
  start(): Promise<void>;
  /**
   * Stop the server.
   */
  stop(): Promise<void>;
  /**
   * Close the browser, stop the server, rebuild the entire extension, and start the server again.
   */
  restart(): Promise<void>;
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
   * @param payload Information about the content script to reload.
   */
  reloadContentScript: (payload: ReloadContentScriptPayload) => void;
  /**
   * Grab the latest runner config and restart the browser.
   */
  restartBrowser: () => void;
}

export interface ReloadContentScriptPayload {
  registration?: BaseContentScriptEntrypointOptions['registration'];
  contentScript: Omit<Scripting.RegisteredContentScript, 'id'>;
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

export interface BackgroundEntrypointOptions extends BaseEntrypointOptions {
  persistent?: PerBrowserOption<boolean>;
  /**
   * Set to `"module"` to output the background entrypoint as ESM. ESM outputs can share chunks and
   * reduce the overall size of the bundled extension.
   *
   * When `undefined`, the background is bundled individually into an IIFE format.
   *
   * @default undefined
   */
  type?: PerBrowserOption<'module'>;
}

export interface BaseContentScriptEntrypointOptions
  extends BaseEntrypointOptions {
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
   *   calling `createShadowRootUi`
   *
   * @default "manifest"
   */
  cssInjectionMode?: PerBrowserOption<'manifest' | 'manual' | 'ui'>;
  /**
   * Specify how the content script is registered.
   *
   * - `"manifest"`: The content script will be added to the `content_scripts` entry in the
   *   manifest. This is the normal and most well known way of registering a content script.
   * - `"runtime"`: The content script's `matches` is added to `host_permissions` and you are
   *   responsible for using the scripting API to register the content script dynamically at
   *   runtime.
   *
   * @default "manifest"
   */
  registration?: PerBrowserOption<'manifest' | 'runtime'>;
}

export interface MainWorldContentScriptEntrypointOptions
  extends BaseContentScriptEntrypointOptions {
  /**
   * See https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#isolated_world
   */
  world: 'MAIN';
}

export interface IsolatedWorldContentScriptEntrypointOptions
  extends BaseContentScriptEntrypointOptions {
  /**
   * See https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#isolated_world
   * @default "ISOLATED"
   */
  world?: 'ISOLATED';
}

export interface PopupEntrypointOptions extends BaseEntrypointOptions {
  /**
   * Defaults to "browser_action" to be equivalent to MV3's "action" key
   */
  mv2Key?: PerBrowserOption<'browser_action' | 'page_action'>;
  defaultIcon?: Record<string, string>;
  defaultTitle?: PerBrowserOption<string>;
  browserStyle?: PerBrowserOption<boolean>;
}

export interface OptionsEntrypointOptions extends BaseEntrypointOptions {
  openInTab?: PerBrowserOption<boolean>;
  browserStyle?: PerBrowserOption<boolean>;
  chromeStyle?: PerBrowserOption<boolean>;
}

export interface SidepanelEntrypointOptions extends BaseEntrypointOptions {
  /**
   * Firefox only. See https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/sidebar_action#syntax
   * @default false
   */
  openAtInstall?: PerBrowserOption<boolean>;
  /**
   * @deprecated See https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/sidebar_action#syntax
   */
  browserStyle?: PerBrowserOption<boolean>;
  defaultIcon?: string | Record<string, string>;
  defaultTitle?: PerBrowserOption<string>;
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
  skipped: boolean;
}

export interface GenericEntrypoint extends BaseEntrypoint {
  type:
    | 'sandbox'
    | 'bookmarks'
    | 'history'
    | 'newtab'
    | 'devtools'
    | 'unlisted-page'
    | 'unlisted-script'
    | 'unlisted-style'
    | 'content-script-style';
  options: ResolvedPerBrowserOptions<BaseEntrypointOptions>;
}

export interface BackgroundEntrypoint extends BaseEntrypoint {
  type: 'background';
  options: ResolvedPerBrowserOptions<BackgroundEntrypointOptions>;
}

export interface ContentScriptEntrypoint extends BaseEntrypoint {
  type: 'content-script';
  options: ResolvedPerBrowserOptions<
    | MainWorldContentScriptEntrypointOptions
    | IsolatedWorldContentScriptEntrypointOptions
  >;
}

export interface PopupEntrypoint extends BaseEntrypoint {
  type: 'popup';
  options: ResolvedPerBrowserOptions<PopupEntrypointOptions, 'defaultIcon'>;
}

export interface OptionsEntrypoint extends BaseEntrypoint {
  type: 'options';
  options: ResolvedPerBrowserOptions<OptionsEntrypointOptions>;
}

export interface SidepanelEntrypoint extends BaseEntrypoint {
  type: 'sidepanel';
  options: ResolvedPerBrowserOptions<SidepanelEntrypointOptions, 'defaultIcon'>;
}

export type Entrypoint =
  | GenericEntrypoint
  | BackgroundEntrypoint
  | ContentScriptEntrypoint
  | PopupEntrypoint
  | OptionsEntrypoint
  | SidepanelEntrypoint;

export type EntrypointGroup = Entrypoint | Entrypoint[];

export type OnContentScriptStopped = (cb: () => void) => void;

export interface IsolatedWorldContentScriptDefinition
  extends IsolatedWorldContentScriptEntrypointOptions {
  /**
   * Main function executed when the content script is loaded.
   */
  main(ctx: ContentScriptContext): void | Promise<void>;
}

export interface MainWorldContentScriptDefinition
  extends MainWorldContentScriptEntrypointOptions {
  /**
   * Main function executed when the content script is loaded.
   */
  main(): void | Promise<void>;
}

export type ContentScriptDefinition =
  | IsolatedWorldContentScriptDefinition
  | MainWorldContentScriptDefinition;

export interface BackgroundDefinition extends BackgroundEntrypointOptions {
  /**
   * Main function executed when the background script is started. Cannot be async.
   */
  main(): void;
}

export interface UnlistedScriptDefinition extends BaseEntrypointOptions {
  /**
   * Main function executed when the unlisted script is ran.
   */
  main(): void | Promise<void>;
}

/**
 * Either a single value or a map of different browsers to the value for that browser.
 */
export type PerBrowserOption<T> = T | PerBrowserMap<T>;
export type PerBrowserMap<T> = { [browser: TargetBrowser]: T };

/**
 * Convert `{ key: PerBrowserOption<T> }` to just `{ key: T }`, stripping away the
 * `PerBrowserOption` type for all fields inside the object.
 *
 * A optional second list of keys can be passed if a field isn't compatible with `PerBrowserOption`, like `defaultIcon`.
 */
export type ResolvedPerBrowserOptions<T, TOmitted extends keyof T = never> = {
  [key in keyof Omit<T, TOmitted>]: T[key] extends PerBrowserOption<infer U>
    ? U
    : T[key];
} & { [key in TOmitted]: T[key] };

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
  >
>;

export type UserManifestFn = (
  env: ConfigEnv,
) => UserManifest | Promise<UserManifest>;

export interface ConfigEnv {
  /**
   * The build mode passed into the CLI. By default, `wxt` uses `"development"` and `wxt build|zip`
   * uses `"production"`.
   */
  mode: string;
  /**
   * The command used to run WXT. `"serve"` during development and `"build"` for any other command.
   */
  command: 'build' | 'serve';
  /**
   * Browser passed in from the CLI via the `-b` or `--browser` flag. Defaults to `"chrome"` when not passed.
   */
  browser: TargetBrowser;
  /**
   * Manifest version passed in from the CLI via the `--mv2` or `--mv3` flags. When not passed, it depends on the target browser. See
   * [the guide](https://wxt.dev/guide/multiple-browsers.html#target-manifest-version) for more
   * details.
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
   * An map of chrome preferences from https://chromium.googlesource.com/chromium/src/+/main/chrome/common/pref_names.h
   *
   * @example
   * // change your downloads directory
   * {
   *   download: {
   *     default_directory: "/my/custom/dir",
   *   },
   * }
   *
   * @default
   * // Enable dev mode and allow content script sourcemaps
   * {
   *   devtools: {
   *     synced_preferences_sync_disabled: {
   *       skipContentScripts: false,
   *     },
   *   }
   *   extensions: {
   *     ui: {
   *       developer_mode: true,
   *     },
   *   }
   * }
   */
  chromiumPref?: string;
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
   * Stop the server.
   */
  close(): Promise<void>;
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

export type HookResult = Promise<void> | void;

export interface WxtHooks {
  /**
   * Called after WXT initialization, when the WXT instance is ready to work.
   * @param wxt The configured WXT object
   * @returns Promise
   */
  ready: (wxt: Wxt) => HookResult;
  /**
   * Called before the build is started in both dev mode and build mode.
   *
   * @param wxt The configured WXT object
   */
  'build:before': (wxt: Wxt) => HookResult;
  /**
   * Called once the build process has finished.
   * @param wxt The configured WXT object
   * @param output The results of the build
   */
  'build:done': (wxt: Wxt, output: Readonly<BuildOutput>) => HookResult;
  /**
   * Called once the manifest has been generated. Used to transform the manifest by reference before
   * it is written to the output directory.
   * @param wxt The configured WXT object
   * @param manifest The manifest that was generated
   */
  'build:manifestGenerated': (
    wxt: Wxt,
    manifest: Manifest.WebExtensionManifest,
  ) => HookResult;
  /**
   * Called once all entrypoints have been loaded from the `entrypointsDir`.
   * @param wxt The configured WXT object
   * @param entrypoints The list of entrypoints to be built
   */
  'entrypoints:resolved': (wxt: Wxt, entrypoints: Entrypoint[]) => HookResult;
  /**
   * Called once all entrypoints have been grouped into their build groups.
   * @param wxt The configured WXT object
   * @param entrypoints The list of groups to build in each build step
   */
  'entrypoints:grouped': (wxt: Wxt, groups: EntrypointGroup[]) => HookResult;
}

export interface Wxt {
  config: ResolvedConfig;
  hooks: Hookable<WxtHooks>;
  /**
   * Alias for config.logger
   */
  logger: Logger;
  /**
   * Reload config file and update the `config` field with the result.
   */
  reloadConfig: () => Promise<void>;
  /**
   * Package manager utilities.
   */
  pm: WxtPackageManager;
}

export interface ResolvedConfig {
  root: string;
  srcDir: string;
  publicDir: string;
  wxtDir: string;
  typesDir: string;
  entrypointsDir: string;
  filterEntrypoints?: Set<string>;
  outBaseDir: string;
  outDir: string;
  debug: boolean;
  /**
   * Directory pointing to `node_modules/wxt`, wherever WXT is installed.
   */
  wxtModuleDir: string;
  mode: string;
  command: 'build' | 'serve';
  browser: TargetBrowser;
  manifestVersion: TargetManifestVersion;
  env: ConfigEnv;
  logger: Logger;
  imports: false | WxtResolvedUnimportOptions;
  manifest: UserManifest;
  fsCache: FsCache;
  server?: WxtDevServer;
  runnerConfig: C12ResolvedConfig<ExtensionRunnerConfig>;
  zip: {
    name?: string;
    artifactTemplate: string;
    sourcesTemplate: string;
    includeSources: string[];
    excludeSources: string[];
    sourcesRoot: string;
    downloadedPackagesDir: string;
    downloadPackages: string[];
  };
  transformManifest: (manifest: Manifest.WebExtensionManifest) => void;
  analysis: {
    enabled: boolean;
    template: NonNullable<PluginVisualizerOptions['template']>;
    /** Absolute file path to the `stats.html` file */
    outputFile: string;
    /** The directory where the final `stats.html` file is located */
    outputDir: string;
    /** Name of the `stats.html` file, minus ".html" */
    outputName: string;
    keepArtifacts: boolean;
  };
  userConfigMetadata: Omit<C12ResolvedConfig<UserConfig>, 'config'>;
  /**
   * Import aliases to absolute paths.
   */
  alias: Record<string, string>;
  experimental: {
    includeBrowserPolyfill: boolean;
  };
  builder: WxtBuilder;
  dev: {
    reloadCommand: string | false;
  };
  hooks: Partial<WxtHooks>;
}

export interface FsCache {
  set(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | undefined>;
}

export interface ExtensionRunner {
  openBrowser(): Promise<void>;
  closeBrowser(): Promise<void>;
}

export type VirtualEntrypointType =
  | 'content-script-main-world'
  | 'content-script-isolated-world'
  | 'background'
  | 'unlisted-script';

export type EslintGlobalsPropValue =
  | boolean
  | 'readonly'
  | 'readable'
  | 'writable'
  | 'writeable';

export interface Eslintrc {
  /**
   * When true, generates a file that can be used by ESLint to know which variables are valid globals.
   *
   * - `'auto'`: Check if eslint is installed, and if it is, generate the helper file
   * - `true`: Generate the helper file
   * - `false`: Don't generate the file
   *
   * @default 'auto'
   */
  enabled?: boolean | 'auto';
  /**
   * File path to save the generated eslint config.
   *
   * @default './.wxt/eslintrc-auto-import.json'
   */
  filePath?: string;
  /**
   * @default true
   */
  globalsPropValue?: EslintGlobalsPropValue;
}

export interface ResolvedEslintrc {
  enabled: boolean;
  /** Absolute path */
  filePath: string;
  globalsPropValue: EslintGlobalsPropValue;
}

export type WxtUnimportOptions = Partial<UnimportOptions> & {
  /**
   * When eslint is installed,
   */
  eslintrc?: Eslintrc;
};

export type WxtResolvedUnimportOptions = Partial<UnimportOptions> & {
  eslintrc: ResolvedEslintrc;
};

/**
 * Package management utils built on top of [`nypm`](https://www.npmjs.com/package/nypm)
 */
export interface WxtPackageManager extends Nypm.PackageManager {
  addDependency: typeof Nypm.addDependency;
  addDevDependency: typeof Nypm.addDevDependency;
  ensureDependencyInstalled: typeof Nypm.ensureDependencyInstalled;
  installDependencies: typeof Nypm.installDependencies;
  removeDependency: typeof Nypm.removeDependency;
  /**
   * Download a package's TGZ file and move it into the `downloadDir`. Use's `npm pack <name>`, so
   * you must have setup authorization in `.npmrc` file, regardless of the package manager used.
   *
   * @param id Name of the package to download, can include a version (like `wxt@0.17.1`)
   * @param downloadDir Where to store the package.
   * @returns Absolute path to downloaded file.
   */
  downloadDependency: (id: string, downloadDir: string) => Promise<string>;
  /**
   * Run `npm ls`, `pnpm ls`, or `bun pm ls`, or `yarn list` and return the results.
   *
   * WARNING: Yarn always returns all dependencies
   */
  listDependencies: (options?: {
    cwd?: string;
    all?: boolean;
  }) => Promise<Dependency[]>;
  /**
   * Key used to override package versions. Sometimes called "resolutions".
   */
  overridesKey: string;
}

export interface Dependency {
  name: string;
  version: string;
}
