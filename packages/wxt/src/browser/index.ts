/**
 * Includes the `browser` API and types when using `extensionApi: 'webextension-polyfill'` (the default).
 *
 * @module wxt/browser
 */

import originalBrowser, { Browser, Runtime, I18n } from 'webextension-polyfill';

export interface AugmentedBrowser extends Browser {
  runtime: WxtRuntime & Runtime.Static;
  i18n: WxtI18n & I18n.Static;
}

export interface WxtRuntime {
  // Overriden per-project
}

export interface WxtI18n {
  // Overriden per-project
}

export const browser: AugmentedBrowser = originalBrowser;

// re-export all the types from webextension-polyfill
// Because webextension-polyfill uses a weird namespace with "import export", there isn't a good way
// to get these types without re-listing them.
/** @ignore */
export type {
  ActivityLog,
  Alarms,
  Bookmarks,
  Action,
  BrowserAction,
  BrowserSettings,
  BrowsingData,
  CaptivePortal,
  Clipboard,
  Commands,
  ContentScripts,
  ContextualIdentities,
  Cookies,
  DeclarativeNetRequest,
  Devtools,
  Dns,
  Downloads,
  Events,
  Experiments,
  Extension,
  ExtensionTypes,
  Find,
  GeckoProfiler,
  History,
  I18n,
  Identity,
  Idle,
  Management,
  Manifest, // TODO: Export custom manifest types that are valid for both Chrome and Firefox.
  ContextMenus,
  Menus,
  NetworkStatus,
  NormandyAddonStudy,
  Notifications,
  Omnibox,
  PageAction,
  Permissions,
  Pkcs11,
  Privacy,
  Proxy,
  Runtime,
  Scripting,
  Search,
  Sessions,
  SidebarAction,
  Storage,
  Tabs,
  Theme,
  TopSites,
  Types,
  Urlbar,
  UserScripts,
  WebNavigation,
  WebRequest,
  Windows,
} from 'webextension-polyfill';
