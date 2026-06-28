import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { createAnalytics } from '../client';
import type { Analytics, AnalyticsConfig } from '../types';

let mockBrowser: any;
let mockIsBackground = false;

vi.mock('@wxt-dev/browser', () => ({
  get browser() {
    return mockBrowser;
  },
}));

vi.mock('@wxt-dev/is-background', () => ({
  isBackground: () => mockIsBackground,
}));

type MessageListener = (message: unknown) => void;
type DisconnectListener = () => void;

function flushMicrotasks(times = 1): Promise<void> {
  if (times <= 0) return Promise.resolve();

  return new Promise((resolve) => {
    queueMicrotask(() => {
      void flushMicrotasks(times - 1).then(resolve);
    });
  });
}

function createPortPair(name: string) {
  const frontendMessageListeners: MessageListener[] = [];
  const backgroundMessageListeners: MessageListener[] = [];
  const disconnectListeners: DisconnectListener[] = [];

  const frontendPort = {
    name,
    onMessage: {
      addListener: vi.fn((listener: MessageListener) => {
        frontendMessageListeners.push(listener);
      }),
    },
    onDisconnect: {
      addListener: vi.fn((listener: DisconnectListener) => {
        disconnectListeners.push(listener);
      }),
    },
    postMessage: vi.fn((message: unknown) => {
      queueMicrotask(() => {
        backgroundMessageListeners.forEach((listener) => listener(message));
      });
    }),
  };

  const backgroundPort = {
    name,
    onMessage: {
      addListener: vi.fn((listener: MessageListener) => {
        backgroundMessageListeners.push(listener);
      }),
    },
    postMessage: vi.fn((message: unknown) => {
      queueMicrotask(() => {
        frontendMessageListeners.forEach((listener) => listener(message));
      });
    }),
  };

  return {
    frontendPort,
    backgroundPort,
    disconnect: () => {
      disconnectListeners.forEach((listener) => listener());
    },
  };
}

function setupBrowser() {
  let connectListener: ((port: any) => void) | undefined;
  let lastPortPair: ReturnType<typeof createPortPair> | undefined;

  const browser = {
    runtime: {
      id: 'test-extension',
      getManifest: vi.fn(() => ({ version: '1.0.0' })),
      getPlatformInfo: vi.fn(async () => ({ arch: 'arm', os: 'mac' })),
      onConnect: {
        addListener: vi.fn((listener: (port: any) => void) => {
          connectListener = listener;
        }),
      },
      connect: vi.fn(({ name }: { name: string }) => {
        lastPortPair = createPortPair(name);
        connectListener?.(lastPortPair.backgroundPort);
        return lastPortPair.frontendPort;
      }),
    },
    storage: {
      local: {
        get: vi.fn(async () => ({})),
        set: vi.fn(async () => {}),
      },
    },
  };

  return {
    browser,
    getLastPortPair: () => lastPortPair,
  };
}

function setupGlobals() {
  vi.stubGlobal('navigator', {
    language: 'en-US',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
  });
  vi.stubGlobal('window', {
    screen: {
      width: 1440,
      height: 900,
    },
  });
  vi.stubGlobal('document', {
    referrer: 'https://example.com/start',
    title: 'Popup',
  });
  vi.stubGlobal('location', {
    href: 'chrome-extension://test/popup.html',
  });
  vi.stubGlobal('crypto', {
    randomUUID: vi.fn(() => 'generated-user-id'),
  });
}

function createConfig(
  overrides: Partial<AnalyticsConfig> = {},
): AnalyticsConfig {
  return {
    providers: [],
    enabled: {
      getValue: vi.fn(async () => true),
      setValue: vi.fn(async () => {}),
    },
    userId: {
      getValue: vi.fn(async () => 'user-1'),
      setValue: vi.fn(async () => {}),
    },
    userProperties: {
      getValue: vi.fn(async () => ({ plan: 'test' })),
      setValue: vi.fn(async () => {}),
    },
    version: '1.0.0',
    ...overrides,
  };
}

describe('createAnalytics', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    mockIsBackground = false;
    setupGlobals();
    mockBrowser = setupBrowser().browser;
  });

  it('exposes promise-returning analytics methods', () => {
    expectTypeOf<ReturnType<Analytics['track']>>().toEqualTypeOf<
      Promise<void>
    >();
    expectTypeOf<ReturnType<Analytics['page']>>().toEqualTypeOf<
      Promise<void>
    >();
    expectTypeOf<ReturnType<Analytics['identify']>>().toEqualTypeOf<
      Promise<void>
    >();
    expectTypeOf<ReturnType<Analytics['setEnabled']>>().toEqualTypeOf<
      Promise<void>
    >();
    expectTypeOf<Parameters<Analytics['page']>>().toEqualTypeOf<
      [url?: string | undefined]
    >();
  });

  it('resolves frontend track calls after the background handler finishes', async () => {
    let resolveTrack: (() => void) | undefined;
    const track = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveTrack = resolve;
        }),
    );

    mockIsBackground = true;
    createAnalytics(
      createConfig({
        providers: [
          () => ({
            identify: vi.fn(async () => {}),
            page: vi.fn(async () => {}),
            track,
          }),
        ],
      }),
    );

    mockIsBackground = false;
    const analytics = createAnalytics();
    const result = analytics.track('installed', { source: 'test' });

    for (let i = 0; i < 10 && track.mock.calls.length === 0; i++) {
      await flushMicrotasks();
    }

    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        event: {
          name: 'installed',
          properties: { source: 'test' },
        },
        meta: expect.objectContaining({
          language: 'en-US',
          screen: '1440x900',
          title: 'Popup',
          url: 'chrome-extension://test/popup.html',
        }),
      }),
    );

    let resolved = false;
    const completion = result.then(() => {
      resolved = true;
    });

    await flushMicrotasks(3);
    expect(resolved).toBe(false);

    resolveTrack?.();
    await completion;
    expect(resolved).toBe(true);
  });

  it('keeps page metadata separate when location is omitted', async () => {
    const page = vi.fn(async () => {});

    mockIsBackground = true;
    createAnalytics(
      createConfig({
        providers: [
          () => ({
            identify: vi.fn(async () => {}),
            page,
            track: vi.fn(async () => {}),
          }),
        ],
      }),
    );

    mockIsBackground = false;
    const analytics = createAnalytics();

    await analytics.page();

    expect(page).toHaveBeenCalledWith(
      expect.objectContaining({
        page: {
          url: 'chrome-extension://test/popup.html',
          location: undefined,
          title: 'Popup',
        },
        meta: expect.objectContaining({
          language: 'en-US',
          title: 'Popup',
          url: 'chrome-extension://test/popup.html',
        }),
      }),
    );
  });

  it('rejects frontend setEnabled calls when the background handler fails', async () => {
    const setValue = vi.fn(async () => {
      throw new Error('storage failed');
    });

    mockIsBackground = true;
    createAnalytics(
      createConfig({
        enabled: {
          getValue: vi.fn(async () => true),
          setValue,
        },
      }),
    );

    mockIsBackground = false;
    const analytics = createAnalytics();

    await expect(analytics.setEnabled(true)).rejects.toThrow('storage failed');
    expect(setValue).toHaveBeenCalledWith(true);
  });
});
