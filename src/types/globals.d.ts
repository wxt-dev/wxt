declare const __DEV_SERVER_PROTOCOL__: string;
declare const __DEV_SERVER_HOSTNAME__: string;
declare const __DEV_SERVER_PORT__: string;

// Globals defined by the vite-plugins/devServerGlobals.ts and utils/globals.ts
interface ImportMetaEnv {
  readonly COMMAND: 'build' | 'serve';
  readonly MANIFEST_VERSION: 2 | 3;
}

/**
 * Not defined by Vite, since it needs to be different for different entrypoints. Instead, this is
 * replaced only in virtual entrypoints when loading the template as text.
 */
declare const __ENTRYPOINT__: string;
