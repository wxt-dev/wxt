declare const __DEV_SERVER_PROTOCOL__: string;
declare const __DEV_SERVER_HOSTNAME__: string;
declare const __DEV_SERVER_PORT__: string;

// Globals defined by the vite-plugins/devServerGlobals.ts and utils/globals.ts
interface ImportMetaEnv {
  readonly COMMAND: WxtCommand;
  readonly MANIFEST_VERSION: 2 | 3;
}

// TODO: Remove PR context
// Moved from import.meta.env.ENTRYPOINT to __ENTRYPOINT__ because ESM content
// scripts are included in the multi-page build, and a simple defines couldn't
// give loaders the actual name of their entrypoint. Instead, when loading the
// virtual entrypoints, we replace this template variable with the actual
// content script's name, which works even when including the content scripts
// in the multi-page build. However, since it can only be used in virtual
// modules, I also edited the content script context to allow access to the
// content script's name.
/**
 * Name of the entrypoint running. Not defined by Vite, since it needs to be different for different
 * entrypoints. Instead, this is replaced only in virtual entrypoints when loading the template as
 * text.
 */
declare const __ENTRYPOINT__: string;
/**
 * URL to load ESM content script from.
 */
declare const __ESM_CONTENT_SCRIPT_URL__: string;
