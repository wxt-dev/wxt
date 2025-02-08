/**
 * Replaced by an import to `wxt/background-client`, which changes based on the
 * manifest version being targeted.
 */
declare const __WXT_BACKGROUND_CLIENT_IMPORT__: void;

// Dev server globals, replaced during development
declare const __DEV_SERVER_PROTOCOL__: string;
declare const __DEV_SERVER_HOSTNAME__: string;
declare const __DEV_SERVER_PORT__: string;

// Global env vars provided by WXT
interface ImportMetaEnv {
  readonly COMMAND: WxtCommand;
  readonly MANIFEST_VERSION: 2 | 3;
  readonly ENTRYPOINT: string;
}
