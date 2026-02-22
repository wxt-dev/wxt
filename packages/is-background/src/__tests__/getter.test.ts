import { describe, it, vi, expect } from 'vitest';
import { getIsBackground } from '../getter';

let mockBrowser: any;
vi.mock('@wxt-dev/browser', () => ({
  get browser() {
    return mockBrowser;
  },
}));

const backgroundWindow = Symbol('Background');
const otherWindow = Symbol('Other');

function setupEnv(options: {
  window: symbol | undefined;
  hasExtensionApis: boolean;
  hasGetBackgroundPage: boolean;
  hasServiceWorkerGlobalScope: boolean;
}): void {
  vi.unstubAllGlobals();
  mockBrowser = undefined;

  if (options.window) {
    vi.stubGlobal('window', options.window);
  }

  if (options.hasExtensionApis) {
    mockBrowser = {
      runtime: {
        id: 'test',
      },
      ...(options.hasGetBackgroundPage && {
        extension: {
          getBackgroundPage: () => backgroundWindow,
        },
      }),
    };
  }

  if (options.hasServiceWorkerGlobalScope) {
    class ServiceWorkerGlobalScope {}
    vi.stubGlobal('ServiceWorkerGlobalScope', ServiceWorkerGlobalScope);
    vi.stubGlobal('self', new ServiceWorkerGlobalScope());
  }
}

describe('isBackground Getter', () => {
  describe('Non-extension contexts', () => {
    it('should return false', () => {
      setupEnv({
        hasServiceWorkerGlobalScope: false,
        hasExtensionApis: false,
        hasGetBackgroundPage: false,
        window: otherWindow,
      });

      expect(getIsBackground()).toBe(false);
    });
  });

  describe('Chromium', () => {
    const hasExtensionApis = true;

    describe('MV2', () => {
      const hasServiceWorkerGlobalScope = false;
      const hasGetBackgroundPage = true;

      it('should return true inside the background page', () => {
        setupEnv({
          hasServiceWorkerGlobalScope,
          hasExtensionApis,
          hasGetBackgroundPage,
          window: backgroundWindow,
        });

        expect(getIsBackground()).toBe(true);
      });

      it('should return false outside the background page', () => {
        setupEnv({
          hasServiceWorkerGlobalScope,
          hasExtensionApis,
          hasGetBackgroundPage,
          window: otherWindow,
        });

        expect(getIsBackground()).toBe(false);
      });
    });

    describe('MV3', () => {
      const hasGetBackgroundPage = false;

      it('should return true inside the service worker', () => {
        setupEnv({
          hasServiceWorkerGlobalScope: true,
          hasExtensionApis,
          hasGetBackgroundPage,
          window: undefined,
        });

        expect(getIsBackground()).toBe(true);
      });

      it('should return false outside the service worker', () => {
        setupEnv({
          hasServiceWorkerGlobalScope: false,
          hasExtensionApis,
          hasGetBackgroundPage,
          window: otherWindow,
        });

        expect(getIsBackground()).toBe(false);
      });
    });
  });

  describe('Firefox & Safari, MV2 & MV3', () => {
    const hasServiceWorkerGlobalScope = false;
    const hasExtensionApis = true;
    const hasGetBackgroundPage = true;

    it('should return true inside the background page', () => {
      setupEnv({
        hasServiceWorkerGlobalScope,
        hasExtensionApis,
        hasGetBackgroundPage,
        window: backgroundWindow,
      });

      expect(getIsBackground()).toBe(true);
    });

    it('should return false outside the background page', () => {
      setupEnv({
        hasServiceWorkerGlobalScope,
        hasExtensionApis,
        hasGetBackgroundPage,
        window: otherWindow,
      });

      expect(getIsBackground()).toBe(false);
    });
  });
});
