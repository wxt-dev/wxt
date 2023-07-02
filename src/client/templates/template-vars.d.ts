// Types required to make templates happy.

declare module '*?raw' {
  const content: any;
  export default content;
}

declare module 'virtual:user-background' {
  const definition: import('../../').BackgroundScriptDefintition;
  export default definition;
}

declare module 'virtual:user-content-script' {
  const definition: import('../../').ContentScriptDefinition;
  export default definition;
}
