export const virtualEntrypointTypes = [
  'content-script-main-world' as const,
  'content-script-isolated-world' as const,
  'content-script-loader' as const,
  'background' as const,
  'unlisted-script' as const,
];
export type VirtualEntrypointType = (typeof virtualEntrypointTypes)[0];

/**
 * All the names of entrypoint files in the `src/virtual/` and `dist/virtual/` directories, minus the extension.
 */
export const virtualEntrypointModuleNames = virtualEntrypointTypes.map(
  (name) => `${name}-entrypoint` as const,
);
/**
 * Name of entrypoint files in the `src/virtual/` and `dist/virtual/` directories, minus the extension.
 */
export type VirtualEntrypointModuleName =
  (typeof virtualEntrypointModuleNames)[0];

/**
 * All the names of files in the `src/virtual/` and `dist/virtual/` directories, minus the extension.
 */
export const virtualModuleNames = [
  ...virtualEntrypointModuleNames,
  'mock-browser' as const,
  'reload-html' as const,
];
/**
 * Name of files in the `src/virtual/` and `dist/virtual/` directories, minus the extension.
 */
export type VirtualModuleName = (typeof virtualModuleNames)[0];

/**
 * Import alias used for importing a virtual module
 */
export type VirtualModuleId = `virtual:wxt-${VirtualModuleName}`;
