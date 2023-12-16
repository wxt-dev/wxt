/**
 * @module wxt/browser
 */
import originalBrowser, { Browser, Runtime, I18n } from 'webextension-polyfill';

export interface AugmentedBrowser extends Browser {
  runtime: WxtRuntime;
  i18n: WxtI18n;
}

export interface WxtRuntime extends Runtime.Static {
  // Overriden per-project
}

export interface WxtI18n extends I18n.Static {
  // Overriden per-project
}

export const browser: AugmentedBrowser = originalBrowser;

// re-export all the types from webextension-polyfill
// Because webextension-polyfill uses a weird namespace with "import export", there isn't a good way
// to get these types without re-listing them.
export {
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
  Manifest,
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
