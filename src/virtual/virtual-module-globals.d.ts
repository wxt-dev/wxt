// Types required to make the virtual modules happy.

declare module 'virtual:user-background' {
  const definition: import('wxt/types').BackgroundDefinition;
  export default definition;
}

declare module 'virtual:user-content-script-isolated-world' {
  const definition: import('wxt/types').ContentScriptIsolatedWorldDefinition;
  export default definition;
}

declare module 'virtual:user-content-script-main-world' {
  const definition: import('wxt/types').ContentScriptMainWorldDefinition;
  export default definition;
}

declare module 'virtual:user-unlisted-script' {
  const definition: import('wxt/types').UnlistedScriptDefinition;
  export default definition;
}
