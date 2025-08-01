import type { ManifestContentScript } from "./core/utils/types";
import type { Browser } from '@wxt-dev/browser';

export type TargetBrowser = string;

/**
 * Either a single value or a map of different browsers to the value for that browser.
 */
export type PerBrowserOption<T> = T | PerBrowserMap<T>;
export type PerBrowserMap<T> = { [browser: TargetBrowser]: T };

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
  matches?: PerBrowserOption<NonNullable<ManifestContentScript['matches']>>;
  /**
   * See https://developer.chrome.com/docs/extensions/mv3/content_scripts/
   * @default "documentIdle"
   */
  runAt?: PerBrowserOption<Browser.scripting.RegisteredContentScript['runAt']>;
  /**
   * See https://developer.chrome.com/docs/extensions/mv3/content_scripts/
   * @default false
   */
  matchAboutBlank?: PerBrowserOption<
    ManifestContentScript['match_about_blank']
  >;
  /**
   * See https://developer.chrome.com/docs/extensions/mv3/content_scripts/
   * @default []
   */
  excludeMatches?: PerBrowserOption<ManifestContentScript['exclude_matches']>;
  /**
   * See https://developer.chrome.com/docs/extensions/mv3/content_scripts/
   * @default []
   */
  includeGlobs?: PerBrowserOption<ManifestContentScript['include_globs']>;
  /**
   * See https://developer.chrome.com/docs/extensions/mv3/content_scripts/
   * @default []
   */
  excludeGlobs?: PerBrowserOption<ManifestContentScript['exclude_globs']>;
  /**
   * See https://developer.chrome.com/docs/extensions/mv3/content_scripts/
   * @default false
   */
  allFrames?: PerBrowserOption<ManifestContentScript['all_frames']>;
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
   *   responsible for using the scripting API to register/execute the content script
   *   dynamically at runtime.
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