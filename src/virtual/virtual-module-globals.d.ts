// Types required to make the virtual modules happy.

declare module '*?raw' {
  const content: any;
  export default content;
}

declare module 'virtual:user-background' {
  const definition: import('~/types').BackgroundDefinition;
  export default definition;
}

declare module 'virtual:user-content-script-isolated-world' {
  const definition: import('~/types').IsolatedWorldContentScriptDefinition;
  export default definition;
}

declare module 'virtual:user-content-script-main-world' {
  const definition: import('~/types').MainWorldContentScriptDefinition;
  export default definition;
}

declare module 'virtual:user-unlisted-script' {
  const definition: import('~/types').UnlistedScriptDefinition;
  export default definition;
}

// Globals defined by the vite-plugins/devServerGlobals.ts and utils/globals.ts
declare const __COMMAND__: 'build' | 'serve';
declare const __DEV_SERVER_PROTOCOL__: string;
declare const __DEV_SERVER_HOSTNAME__: string;
declare const __DEV_SERVER_PORT__: string;
declare const __MANIFEST_VERSION__: 2 | 3;
declare const __ENTRYPOINT__: string;
