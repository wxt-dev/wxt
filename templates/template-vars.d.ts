// Types required to make templates happy.

declare module '*?raw' {
  const content: any;
  export default content;
}

declare module '{{moduleId}}' {
  const variable: any;
  export default variable;
}
