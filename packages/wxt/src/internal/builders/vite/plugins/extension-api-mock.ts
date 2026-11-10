import type * as vite from 'vite';
import { virtualModules } from '../../../../internal-utils/virtual-modules';

/**
 * Mock `wxt/browser` and stub the global `browser`/`chrome` types with a fake
 * version of the extension APIs
 */
export function extensionApiMock(): vite.PluginOption {
  const virtualSetupModule = 'virtual:wxt-setup';
  const resolvedVirtualSetupModule = '\0' + virtualSetupModule;
  const virtualMockBrowser = 'virtual:wxt-mock-browser';
  const resolvedVirtualMockBrowser = '\0' + virtualMockBrowser;

  return {
    name: 'wxt:extension-api-mock',
    config() {
      const replacement = virtualMockBrowser;
      return {
        test: {
          setupFiles: [virtualSetupModule],
        },
        resolve: {
          alias: [
            // wxt/browser, wxt/browser/...
            { find: 'wxt/browser', replacement },
          ],
        },
        ssr: {
          // Inline all WXT modules sub-dependencies can be mocked
          noExternal: ['wxt'],
        },
      };
    },
    resolveId: {
      filter: {
        id: new RegExp(`(${virtualSetupModule}|${virtualMockBrowser})$`),
      },
      handler(id) {
        return id.endsWith(virtualMockBrowser)
          ? resolvedVirtualMockBrowser
          : resolvedVirtualSetupModule;
      },
    },
    load: {
      filter: {
        id: new RegExp(
          `^(${resolvedVirtualSetupModule}|${resolvedVirtualMockBrowser})$`,
        ),
      },
      handler(id) {
        return id === resolvedVirtualMockBrowser
          ? virtualModules['mock-browser']
          : setupTemplate;
      },
    },
  };
}

const setupTemplate = `
  import { vi } from 'vitest';
  import { fakeBrowser } from 'wxt/testing/fake-browser';

  vi.stubGlobal("chrome", fakeBrowser);
  vi.stubGlobal("browser", fakeBrowser);
`;
