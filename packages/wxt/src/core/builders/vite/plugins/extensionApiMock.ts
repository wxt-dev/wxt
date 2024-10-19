import type * as vite from 'vite';

/**
 * Stub the global `chrome` and `browser` variables with a fake version of the extension APIs.
 */
export function extensionApiMock(): vite.PluginOption {
  const virtualSetupModule = 'virtual:wxt-setup';
  const resolvedVirtualSetupModule = '\0' + virtualSetupModule;

  return {
    name: 'wxt:extension-api-mock',
    resolveId(id) {
      if (id.endsWith(virtualSetupModule)) return resolvedVirtualSetupModule;
    },
    load(id) {
      if (id === resolvedVirtualSetupModule) return setupTemplate;
    },
  };
}

const setupTemplate = `
  import { vi } from 'vitest';
  import { fakeBrowser } from 'wxt/testing';

  vi.stubGlobal("chrome", fakeBrowser);
  vi.stubGlobal("browser", fakeBrowser);
`;
