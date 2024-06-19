/**
 * @module wxt/browser
 */
import originalBrowser from 'webextension-polyfill';
import type { AugmentedBrowser } from './types';
import { modifyI18n } from './i18n';

export * from './types';

const browser: AugmentedBrowser = originalBrowser;
browser.i18n = modifyI18n(browser, browser.i18n);
export { browser };

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
