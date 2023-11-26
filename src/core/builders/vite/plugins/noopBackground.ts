import { Plugin } from 'vite';

/**
 * In dev mode, if there's not a background script listed, we need to add one.
 *
 * This define's a virtual module that is basically just a noop.
 */
export function noopBackground(): Plugin {
  const virtualModuleId = VIRTUAL_NOOP_BACKGROUND_MODULE_ID;
  const resolvedVirtualModuleId = '\0' + virtualModuleId;
  return {
    name: 'wxt:noop-background',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId;
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        return `import { defineBackground } from 'wxt/client';\nexport default defineBackground(() => void 0)`;
      }
    },
  };
}

export const VIRTUAL_NOOP_BACKGROUND_MODULE_ID = 'virtual:user-background';
