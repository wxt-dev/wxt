// Types required to make the virtual modules happy.

declare module 'virtual:user-background-entrypoint' {
  const definition: { main: () => void };
  export default definition;
}

declare module 'virtual:user-content-script-isolated-world-entrypoint' {
  const definition: {
    main: (
      ctx: import('wxt/client').ContentScriptContext,
    ) => void | Promise<void>;
  };
  export default definition;
}

declare module 'virtual:user-content-script-main-world-entrypoint' {
  const definition: { main: () => void | Promise<void> };
  export default definition;
}

declare module 'virtual:user-unlisted-script-entrypoint' {
  const definition: { main: () => void | Promise<void> };
  export default definition;
}

declare module 'wxt/browser' {
  export const browser: import('webextension-polyfill').Browser;
}

declare module 'wxt/client' {
  export class ContentScriptContext {
    constructor(name: string, options: any);
  }
}

declare module 'wxt/testing' {
  export const fakeBrowser: import('webextension-polyfill').Browser;
}

declare module 'virtual:wxt-plugins' {
  export function initPlugins(): void;
}
