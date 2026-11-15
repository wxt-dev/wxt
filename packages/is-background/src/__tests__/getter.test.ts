import { describe, it, mock, expect, afterEach } from 'bun:test';

import { getIsBackground } from '../getter';

let mockBrowser: any;
mock.module('@wxt-dev/browser', () => ({
  browser: new Proxy({}, { get: (_, prop) => mockBrowser?.[prop] }),
}));

const backgroundWindow = Symbol('Background');
const otherWindow = Symbol('Other');

const globals = globalThis as Record<string, unknown>;
const originals = new Map<string, { existed: boolean; value: unknown }>();

function stubGlobal(name: string, value: unknown) {
  if (!originals.has(name)) {
    originals.set(name, { existed: name in globals, value: globals[name] });
  }
  globals[name] = value;
}

function unstubAllGlobals() {
  for (const [name, { existed, value }] of originals) {
    if (existed) globals[name] = value;
    else delete globals[name];
  }
  originals.clear();
}

afterEach(unstubAllGlobals);

function setupEnv(options: {
  window: symbol | undefined;
  hasExtensionApis: boolean;
  hasGetBackgroundPage: boolean;
  hasServiceWorkerGlobalScope: boolean;
}): void {
  unstubAllGlobals();
  mockBrowser = undefined;

  if (options.window) {
    stubGlobal('window', options.window);
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
    stubGlobal('ServiceWorkerGlobalScope', ServiceWorkerGlobalScope);
    stubGlobal('self', new ServiceWorkerGlobalScope());
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

  describe('Chromium & Safari', () => {
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

  describe('Firefox, MV2 & MV3', () => {
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
