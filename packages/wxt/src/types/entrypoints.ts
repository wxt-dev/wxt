import type { Manifest } from 'wxt/browser';

/**
 * Defines a content script entrypoint.
 */
export interface ContentScriptDefinition {
  /**
   * CSS files to inject into matching pages.
   */
  css?: string[];

  /**
   * JavaScript files to inject into matching pages.
   */
  js?: string[];

  /**
   * URL patterns to match for content script injection.
   */
  matches?: string[];

  /**
   * How the content script should be registered.
   *
   * - `'manifest'`: (default) Script is registered in the manifest with `matches`. Requires host permissions at install time.
   * - `'runtime'`: Script is registered dynamically at runtime using the `browser.scripting.registerContentScripts` API. Requires host permissions at install time.
   * - `'optional'`: Script matches are moved to `optional_host_permissions` and must be registered dynamically at runtime. This allows users to opt-in to the content script by granting the optional permission.
   */
  registration?: 'manifest' | 'runtime' | 'optional';

  /**
   * When to inject the content script.
   * @default 'document_idle'
   */
  runAt?: 'document_start' | 'document_idle' | 'document_end';

  /**
   * Execution world for the content script.
   */
  world?: 'ISOLATED' | 'MAIN';

  /**
   * Whether to match about:blank, about:srcdoc, etc.
   */
  matchAboutBlank?: boolean;

  /**
   * Whether to match frames.
   */
  allFrames?: boolean;

  /**
   * Specific pages to exclude.
   */
  excludeMatches?: string[];

  /**
   * CSS selectors to include.
   */
  includeGlobs?: string[];

  /**
   * CSS selectors to exclude.
   */
  excludeGlobs?: string[];
}

/**
 * Defines a background script/service worker entrypoint.
 */
export interface BackgroundDefinition {
  /**
   * Background script type.
   */
  type?: 'module';

  /**
   * Whether the background script persists.
   */
  persistent?: boolean;
}

/**
 * Defines a popup entrypoint.
 */
export interface PopupDefinition {
  /**
   * HTML file for the popup.
   */
  html?: string;
}

/**
 * Defines an options page entrypoint.
 */
export interface OptionsDefinition {
  /**
   * HTML file for the options page.
   */
  html?: string;

  /**
   * Whether to open in a tab or popup.
   */
  openInTab?: boolean;
}
