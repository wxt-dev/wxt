// Types required to make the virtual modules happy.

declare module 'virtual:user-background' {
  const definition: { main: () => void };
  export default definition;
}

declare module 'virtual:user-content-script-isolated-world' {
  const definition: {
    main: (
      ctx: import('wxt/client').ContentScriptContext,
    ) => void | Promise<void>;
  };
  export default definition;
}

declare module 'virtual:user-content-script-main-world' {
  const definition: { main: () => void | Promise<void> };
  export default definition;
}

declare module 'virtual:user-unlisted-script' {
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
