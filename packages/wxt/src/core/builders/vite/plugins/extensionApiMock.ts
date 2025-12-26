import path from 'node:path';
import type * as vite from 'vite';
import { ResolvedConfig } from '../../../../types';

/**
 * Mock `wxt/browser` and stub the global `browser`/`chrome` types with a fake version of the extension APIs
 */
export function extensionApiMock(config: ResolvedConfig): vite.PluginOption {
  const VIRTUAL_SETUP_MODULE = 'virtual:wxt-setup';
  const RESOLVED_VIRTUAL_SETUP_MODULE = '\0' + VIRTUAL_SETUP_MODULE;

  return {
    name: 'wxt:extension-api-mock',
    config() {
      const replacement = path.resolve(
        config.wxtModuleDir,
        'dist/virtual/mock-browser',
      );
      return {
        test: {
          setupFiles: [VIRTUAL_SETUP_MODULE],
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
    resolveId(id) {
      if (id.endsWith(VIRTUAL_SETUP_MODULE))
        return RESOLVED_VIRTUAL_SETUP_MODULE;
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_SETUP_MODULE) return SETUP_TEMPLATE;
    },
  };
}

const SETUP_TEMPLATE = `
  import { vi } from 'vitest';
  import { fakeBrowser } from 'wxt/testing/fake-browser';

  vi.stubGlobal("chrome", fakeBrowser);
  vi.stubGlobal("browser", fakeBrowser);
`;
