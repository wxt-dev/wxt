/** @vitest-environment happy-dom */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fakeBrowser } from '@webext-core/fake-browser';
import { ContentScriptContext } from '../../content-script-context';
import { WxtLocationChangeEvent, getUniqueEventName } from '../custom-events';
import { createLocationWatcher } from '../location-watcher';

/** Minimal stand-in for the parts of the Navigation API the watcher uses. */
function fakeNavigationApi() {
  const listeners: Record<string, ((event: any) => void)[]> = {};
  return {
    addEventListener(type: string, cb: (event: any) => void) {
      (listeners[type] ??= []).push(cb);
    },
    /** Commit a same-document navigation, like an SPA router would. */
    navigate(to: string) {
      // `navigate` fires while `location.href` is still the old URL...
      listeners['navigate']?.forEach((cb) => cb({ destination: { url: to } }));
      // ...then the navigation commits, firing `currententrychange`.
      setUrl(to);
      listeners['currententrychange']?.forEach((cb) => cb({}));
    },
    has(type: string) {
      return (listeners[type]?.length ?? 0) > 0;
    },
  };
}

/** Subscribe without going through `ctx`, which starts a watcher of its own. */
function onLocationChange(cb: (event: WxtLocationChangeEvent) => void) {
  const handler = (event: Event) => cb(event as WxtLocationChangeEvent);
  window.addEventListener(WxtLocationChangeEvent.EVENT_NAME, handler);
  return () =>
    window.removeEventListener(WxtLocationChangeEvent.EVENT_NAME, handler);
}

function setUrl(url: string) {
  (
    window as unknown as { happyDOM: { setURL: (url: string) => void } }
  ).happyDOM.setURL(url);
}

describe('Location Watcher', () => {
  beforeEach(() => {
    fakeBrowser.runtime.id = 'anything';
    WxtLocationChangeEvent.EVENT_NAME =
      getUniqueEventName('wxt:locationchange');
    setUrl('https://example.com/a');
  });

  afterEach(() => {
    delete (globalThis as any).navigation;
    vi.unstubAllGlobals();
  });

  it('should report the committed URL, not the pending one', async () => {
    const navigation = fakeNavigationApi();
    vi.stubGlobal('navigation', navigation);
    // `supportsNavigationApi` is set at module load, so re-import.
    vi.resetModules();
    const { createLocationWatcher: create } =
      await import('../location-watcher');

    const ctx = new ContentScriptContext('test');
    const seen: Array<{ href: string; location: string }> = [];
    onLocationChange((event) =>
      seen.push({ href: event.newUrl.href, location: location.href }),
    );
    create(ctx).run();

    navigation.navigate('https://example.com/b');

    expect(navigation.has('currententrychange')).toBe(true);
    expect(seen).toEqual([
      {
        href: 'https://example.com/b',
        // The point: listeners see the new page, not the old one.
        location: 'https://example.com/b',
      },
    ]);
  });

  it('should detect URL changes by polling when the Navigation API is missing', () => {
    vi.useFakeTimers();
    const ctx = new ContentScriptContext('test');
    const handler = vi.fn();
    onLocationChange(handler);
    createLocationWatcher(ctx).run();

    setUrl('https://example.com/b');
    vi.advanceTimersByTime(1000);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].newUrl.href).toBe('https://example.com/b');
    vi.useRealTimers();
  });

  it('should not fire when the URL has not changed', () => {
    vi.useFakeTimers();
    const ctx = new ContentScriptContext('test');
    const handler = vi.fn();
    onLocationChange(handler);
    createLocationWatcher(ctx).run();

    vi.advanceTimersByTime(5000);

    expect(handler).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
