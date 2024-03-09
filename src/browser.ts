/**
 * @module wxt/browser
 */
import originalBrowser, {
  Browser,
  Runtime,
  I18n,
  DeclarativeNetRequest,
} from 'webextension-polyfill';

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

export namespace Manifest {
  export type Manifest = ManifestV2 | ManifestV3;

  export interface ManifestV2 {
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/manifest/manifest_version>
     */
    manifest_version: 2;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/manifest/name>
     */
    name: string;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/manifest/version>
     */
    version: string;

    /**
     * See <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/author>
     */
    author?: string;
    /**
     * See <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings>
     */
    browser_specific_settings?: BrowserSpecificSettings;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/manifest/default-locale>
     */
    default_locale?: SupportedLocale;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/manifest/description>
     */
    description?: string;
    /**
     * See <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/declarative_net_request>
     */
    declarative_net_request?: DeclativeNetRequestDefinition;
    /**
     * See <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/developer>
     */
    developer?: Developer;
    /**
     * See <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/dictionaries>
     */
    dictionaries?: Record<string, string>;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/manifest/icons>
     */
    icons?: IconMap | string;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/reference/browserAction>
     */
    browser_action?: Action;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/reference/pageAction>
     */
    page_action?: PageAction;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/background-pages>
     */
    background?: ManfiestV2Background;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/settings-override>
     */
    chrome_settings_override?: originalBrowser.Manifest.WebExtensionManifestChromeSettingsOverridesType;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/override>
     */
    chrome_url_overrides?: ChromeUrlOverrides;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/reference/commands>
     */
    commands?: Commands;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/content-scripts>
     */
    content_scripts?: ContentScript[];
    /**
     * See <https://developer.chrome.com/docs/apps/contentSecurityPolicy>
     */
    content_security_policy?: string;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/manifest/cross-origin-embedder-policy>
     */
    cross_origin_embedder_policy?: { value: string };
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/manifest/cross-origin-opener-policy>
     */
    cross_origin_opener_policy?: { value: string };
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/devtools#devtools-page>
     */
    devtools_page?: string;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/manifest/event-rules>
     */
    event_rules?: Omit<DeclarativeNetRequest.Rule, 'id'>[];
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/manifest/externally-connectable>
     */
    externally_connectable?: ExternalConnections;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/reference/fileBrowserHandler>
     */
    file_browser_handlers?: FileBrowserHandler[];
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/reference/fileSystemProvider>
     */
    file_system_provider_capabilities?: FileSystemProviderCapabilities;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/shared-modules>
     */
    export?: Export;
    homepage_url?: string;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/shared-modules>
     */
    import?: Import;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/manifest/incognito>
     * @default "spanning"
     */
    incognito?: 'spanning' | 'split' | 'not_allowed';
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/manifest/key>
     */
    key?: string;
    minimum_chrome_version?: string;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/manifest/nacl-modules>
     */
    nacl_modules?: NaclModule[];
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/manifest/offline-enabled>
     */
    offline_enabled?: boolean;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/reference/omnibox>
     */
    omnibox?: Omnibox;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/reference/permissions>
     */
    optional_permissions?: string[];
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/options>
     */
    options_page?: string;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/options>
     */
    options_ui?: Options;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/reference/permissions>
     */
    permissions?: string[];
    /**
     * See <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/protocol_handlers>
     */
    protocol_handlers?: ProtocolHandler[];
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/manifest/requirements>
     */
    requirements?: Requirements;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/manifest/sandbox>
     */
    sandbox?: ManifestV2Sandbox;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/manifest/name>
     */
    short_name?: string;
    /**
     * See <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/sidebar_action>
     */
    sidebar_action?: SidebarAction;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/manifest/storage>
     */
    storage?: StorageDefinition;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/reference/ttsEngine>
     */
    tts_engine?: TtsEngine;
    /**
     * See <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/theme>
     */
    theme?: Theme;
    /**
     * See <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/theme_experiment>
     */
    theme_experiment?: ThemeExperiment;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/hosting>
     */
    update_url?: string;
    /**
     * See <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/user_scripts>
     */
    user_scripts: UserScripts;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/manifest/version>
     */
    version_name?: string;
    /**
     * See <https://developer.chrome.com/docs/extensions/mv2/manifest/web-accessible-resources>
     */
    web_accessible_resources?: string[];
  }
  export interface ManifestV3 {
    /**
     * See <https://developer.chrome.com/docs/extensions/reference/api/action>
     */
    action?: Action;
    web_accessible_resources?: ManifestV3WebAccessibleResource[];
  }
  export interface ManifestV3WebAccessibleResource {
    matches: string[];
    resources: string[];
  }
  export interface ContentScript {
    /**
     * See <https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#static-declarative>
     */
    matches: string[];
    /**
     * See <https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#static-declarative>
     * @default undefined
     */
    js?: string[];
    /**
     * See <https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#static-declarative>
     * @default undefined
     */
    css?: string[];
    /**
     * See <https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#static-declarative>
     * @default undefined
     */
    all_frames?: boolean;
    /**
     * See <https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#static-declarative>
     * @default undefined
     */
    match_about_blank?: boolean;
    /**
     * See <https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#static-declarative>
     * @default undefined
     */
    exclude_globs?: string[];
    /**
     * See <https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#static-declarative>
     * @default undefined
     */
    exclude_matches?: string[];
    /**
     * See <https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#static-declarative>
     * @default undefined
     */
    include_globs?: string[];
    /**
     * See <https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#run_time>
     * @default "document_idle"
     */
    run_at?: ContentScriptRunAt;
    /**
     * See <https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#static-declarative>
     * @default undefined
     */
    match_origin_as_fallback?: boolean;
    /**
     * See <https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#isolated_world>
     * @default "ISOLATED"
     */
    world?: ContentScriptExecutionWorld;
  }

  /**
   * See <https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts#run_time>
   */
  export type ContentScriptRunAt =
    | 'document_start'
    | 'document_end'
    | 'document_idle';
  export type ContentScriptExecutionWorld = 'ISOLATED' | 'MAIN';

  /**
   * See <https://developer.chrome.com/docs/extensions/reference/api/i18n#supported-locales>
   */
  export type SupportedLocale =
    | 'ar'
    | 'am'
    | 'bg'
    | 'bn'
    | 'ca'
    | 'cs'
    | 'da'
    | 'de'
    | 'el'
    | 'en'
    | 'en_AU'
    | 'en_GB'
    | 'en_US'
    | 'es'
    | 'es_419'
    | 'et'
    | 'fa'
    | 'fi'
    | 'fil'
    | 'fr'
    | 'gu'
    | 'he'
    | 'hi'
    | 'hr'
    | 'hu'
    | 'id'
    | 'it'
    | 'ja'
    | 'kn'
    | 'ko'
    | 'lt'
    | 'lv'
    | 'ml'
    | 'mr'
    | 'ms'
    | 'nl'
    | 'no'
    | 'pl'
    | 'pt_BR'
    | 'pt_PT'
    | 'ro'
    | 'ru'
    | 'sk'
    | 'sl'
    | 'sr'
    | 'sv'
    | 'sw'
    | 'ta'
    | 'te'
    | 'th'
    | 'tr'
    | 'uk'
    | 'vi'
    | 'zh_CN'
    | 'zh_TW';

  /**
   * Map of icon sizes to file paths.
   *
   * See <https://developer.chrome.com/docs/extensions/reference/manifest/icons>
   */
  export interface IconMap {
    [size: number | string]: string;
  }

  export interface Action {
    default_icon?: IconMap | string;
    default_title?: string;
    default_popup?: string;
    browser_style?: boolean;
    default_area?: 'navbar' | 'menupanel' | 'tabstrip' | 'personaltoolbar';
    theme_icons?: {
      dark: string;
      light: string;
      size: string;
    };
  }

  export interface PageAction extends Action {
    hide_matches?: string[];
    show_matches?: string[];
    pinned?: boolean;
  }

  export interface ManfiestV2Background {
    persistent?: boolean;
    scripts?: string[];
    page?: string;
  }

  export interface ChromeUrlOverrides {
    bookmarks?: string;
    history?: string;
    newtab?: string;
  }

  export interface Commands {
    [command: string]: {
      suggested_key: {
        default?: string;
        windows?: string;
        mac?: string;
        chromeos?: string;
        linux?: string;
      };
      description: string;
    };
  }

  export interface ExternalConnections {
    ids?: string[];
    matches: string[];
    accepts_tls_channel_id?: boolean;
  }

  export interface FileBrowserHandler {
    id: string;
    default_title: string;
    file_filters: string[];
  }

  export interface FileSystemProviderCapabilities {
    source: 'file' | 'device' | 'network';
    configurable?: boolean;
    watchable?: boolean;
    multiple_mounts?: boolean;
  }

  export interface Export {
    allowlist: string[];
  }
  export interface Import {
    id: string;
    minimum_version?: string;
  }

  export interface NaclModule {
    path: string;
    mime_type: string;
  }

  export interface Omnibox {
    keyword: string;
  }

  export interface Options {
    chrome_style?: boolean;
    browser_style?: boolean;
    open_in_tab?: boolean;
    page: string;
  }

  export interface Requirements {
    '3D': {
      features: ['webgl'];
    };
  }

  export interface ManifestV2Sandbox {
    pages: string[];
    content_security_policy?: string;
  }

  export interface StorageDefinition {
    managed_schema: string;
  }

  export interface TtsEngine {
    voices: TtsVoice[];
  }
  export interface TtsVoice {
    voice_name: string;
    lang?: string;
    event_types?: string;
  }

  export interface BrowserSpecificSettings {
    gecko?: {
      id?: string;
      strict_min_version?: string;
      strict_max_version?: string;
      update_url?: string;
    };
    gecko_android?: {
      strict_min_version?: string;
      strict_max_version?: string;
    };
  }

  export interface DeclativeNetRequestDefinition {
    rule_resources: [
      {
        id: string;
        enabled: boolean;
        path: string;
      },
    ];
  }

  export interface Developer {
    name?: string;
    url?: string;
  }

  export interface ProtocolHandler {
    protocol: string;
    name: string;
    uriTemplate: string;
  }

  export interface SidebarAction {
    browser_style?: boolean;
    default_icon?: IconMap | string;
    default_panel?: string;
    default_title?: string;
    open_at_install?: boolean;
  }

  export interface Theme {
    images?: {
      theme_frame?: string;
      additional_backgrounds?: string[];
    };
    /**
     * See <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/theme#colors>
     */
    colors: Record<string, string>;
    properties?: any;
  }

  export interface ThemeExperiment {
    stylesheet?: string;
    colors?: Record<string, string>;
    images?: Record<string, string>;
    properties: Record<string, string>;
  }

  export interface UserScripts {
    api_script: string;
  }
}
