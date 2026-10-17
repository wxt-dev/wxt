/** @vitest-environment happy-dom */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fakeBrowser } from '@webext-core/fake-browser';
import { ContentScriptContext } from '../../content-script-context';
import { WxtLocationChangeEvent, getUniqueEventName } from '../custom-events';
import {
  getDefaultSpaKey,
  runSpaContentScript,
  type SpaContentScriptDefinition,
} from '../spa-content-script';

/** `happyDOM` isn't in happy-dom's global types. */
function setUrl(url: string) {
  (
    window as unknown as { happyDOM: { setURL: (url: string) => void } }
  ).happyDOM.setURL(url);
}

/**
 * Events dispatched on window/document fire on the next tick, so wait a timeout
 * of 0 to make sure they've been handled.
 */
function flush() {
  return new Promise((res) => setTimeout(res));
}

/** Simulate an SPA navigation the same way `createLocationWatcher` does. */
async function navigate(to: string) {
  const oldUrl = new URL(window.location.href);
  const newUrl = new URL(to, oldUrl);
  setUrl(newUrl.href);
  window.dispatchEvent(new WxtLocationChangeEvent(newUrl, oldUrl));
  await flush();
}

function setup(
  definition: Partial<SpaContentScriptDefinition> & { main?: any } = {},
) {
  const main = definition.main ?? vi.fn();
  const resolved: SpaContentScriptDefinition = {
    matches: ['*://*.youtube.com/watch*'],
    spa: true,
    ...definition,
    main,
  };
  const parentCtx = new ContentScriptContext('test', resolved as any);
  return { main, parentCtx, resolved };
}

describe('SPA Content Script', () => {
  beforeEach(() => {
    vi.useRealTimers();
    fakeBrowser.runtime.id = 'anything';
    // Static computed at module load, before `runtime.id` was faked.
    // Recompute so dispatched events match what `ctx` listens for.
    WxtLocationChangeEvent.EVENT_NAME =
      getUniqueEventName('wxt:locationchange');
    setUrl('https://www.youtube.com/');
  });

  describe('getDefaultSpaKey', () => {
    it.each([
      ['https://youtube.com/watch?v=1', 'https://youtube.com/watch?v=1'],
      // Hash ignored, so anchors don't tear down the context
      ['https://youtube.com/watch?v=1#t=30', 'https://youtube.com/watch?v=1'],
      ['https://youtube.com/watch', 'https://youtube.com/watch'],
    ])('%s → %s', (input, expected) => {
      expect(getDefaultSpaKey(new URL(input))).toBe(expected);
    });
  });

  it('should not run main when the initial URL does not match', async () => {
    setUrl('https://www.youtube.com/feed/subscriptions');
    const { main, parentCtx, resolved } = setup();

    await runSpaContentScript(parentCtx, resolved, 'test');

    expect(main).not.toHaveBeenCalled();
  });

  it('should run main immediately when the initial URL matches', async () => {
    setUrl('https://www.youtube.com/watch?v=1');
    const { main, parentCtx, resolved } = setup();

    const result = await runSpaContentScript(parentCtx, resolved, 'test');

    expect(main).toHaveBeenCalledTimes(1);
    expect(result).toBeUndefined();
  });

  it("should return the initial main's result so executeScript still reports a value", async () => {
    setUrl('https://www.youtube.com/watch?v=1');
    const { parentCtx, resolved } = setup({ main: vi.fn(() => 'result') });

    const result = await runSpaContentScript(parentCtx, resolved, 'test');

    expect(result).toBe('result');
  });

  it('should run main when navigating onto a matching URL', async () => {
    setUrl('https://www.youtube.com/');
    const { main, parentCtx, resolved } = setup();
    await runSpaContentScript(parentCtx, resolved, 'test');
    expect(main).not.toHaveBeenCalled();

    await navigate('https://www.youtube.com/watch?v=1');

    expect(main).toHaveBeenCalledTimes(1);
  });

  it('should abort the context when navigating off a matching URL', async () => {
    setUrl('https://www.youtube.com/watch?v=1');
    const onInvalidated = vi.fn();
    const { parentCtx, resolved } = setup({
      main: vi.fn((ctx: ContentScriptContext) =>
        ctx.onInvalidated(onInvalidated),
      ),
    });
    await runSpaContentScript(parentCtx, resolved, 'test');

    await navigate('https://www.youtube.com/feed/subscriptions');

    expect(onInvalidated).toHaveBeenCalledTimes(1);
  });

  it('should tear down and re-run with a new context when navigating between matching pages', async () => {
    setUrl('https://www.youtube.com/watch?v=1');
    const contexts: ContentScriptContext[] = [];
    const { parentCtx, resolved } = setup({
      main: vi.fn((ctx: ContentScriptContext) => void contexts.push(ctx)),
    });
    await runSpaContentScript(parentCtx, resolved, 'test');

    await navigate('https://www.youtube.com/watch?v=2');

    expect(contexts).toHaveLength(2);
    expect(contexts[0]).not.toBe(contexts[1]);
    expect(contexts[0].isValid).toBe(false);
    expect(contexts[1].isValid).toBe(true);
  });

  it('should leave the context alone when only the hash changes', async () => {
    setUrl('https://www.youtube.com/watch?v=1');
    const { main, parentCtx, resolved } = setup();
    await runSpaContentScript(parentCtx, resolved, 'test');

    await navigate('https://www.youtube.com/watch?v=1#t=30');

    expect(main).toHaveBeenCalledTimes(1);
  });

  it('should use a custom `spa.key` to decide when to re-run main', async () => {
    setUrl('https://www.youtube.com/watch?v=1');
    const { main, parentCtx, resolved } = setup({
      // Ignore the query string entirely
      spa: { key: (url) => url.pathname },
    });
    await runSpaContentScript(parentCtx, resolved, 'test');

    await navigate('https://www.youtube.com/watch?v=2');

    expect(main).toHaveBeenCalledTimes(1);
  });

  it('should re-run main when a custom spa.key changes', async () => {
    setUrl('https://www.youtube.com/watch?v=1');
    const { main, parentCtx, resolved } = setup({
      matches: ['*://*.youtube.com/*'],
      spa: { key: (url) => url.pathname },
    });
    await runSpaContentScript(parentCtx, resolved, 'test');

    await navigate('https://www.youtube.com/playlist?list=1');

    expect(main).toHaveBeenCalledTimes(2);
  });

  it('should not re-run main when the same URL is reported twice', async () => {
    setUrl('https://www.youtube.com/watch?v=1');
    const { main, parentCtx, resolved } = setup();
    await runSpaContentScript(parentCtx, resolved, 'test');

    // The polling fallback compares against its own `lastUrl`, but don't rely
    // on that to avoid running `main` again for a page already mounted.
    await navigate('https://www.youtube.com/watch?v=1');

    expect(main).toHaveBeenCalledTimes(1);
  });

  it('should apply excludeMatches at runtime', async () => {
    setUrl('https://www.youtube.com/watch?v=1');
    const { main, parentCtx, resolved } = setup({
      matches: ['*://*.youtube.com/*'],
      excludeMatches: ['*://*.youtube.com/watch*'],
    });

    await runSpaContentScript(parentCtx, resolved, 'test');
    expect(main).not.toHaveBeenCalled();

    await navigate('https://www.youtube.com/playlist?list=1');
    expect(main).toHaveBeenCalledTimes(1);
  });

  it('should abort the active child context when the parent is invalidated', async () => {
    setUrl('https://www.youtube.com/watch?v=1');
    const onInvalidated = vi.fn();
    const { parentCtx, resolved } = setup({
      main: vi.fn((ctx: ContentScriptContext) =>
        ctx.onInvalidated(onInvalidated),
      ),
    });
    await runSpaContentScript(parentCtx, resolved, 'test');

    parentCtx.notifyInvalidated();

    expect(onInvalidated).toHaveBeenCalledTimes(1);
  });

  it('should not invalidate the parent context when creating a child context', async () => {
    setUrl('https://www.youtube.com/watch?v=1');
    const { parentCtx, resolved } = setup();

    await runSpaContentScript(parentCtx, resolved, 'test');
    await flush();

    expect(parentCtx.isValid).toBe(true);
  });

  it('should resolve per-browser matches against the target browser', async () => {
    const original = import.meta.env.BROWSER;
    import.meta.env.BROWSER = 'firefox';
    try {
      setUrl('https://www.youtube.com/watch?v=1');
      const { main, parentCtx, resolved } = setup({
        matches: {
          chrome: ['*://*.youtube.com/playlist*'],
          firefox: ['*://*.youtube.com/watch*'],
        } as any,
      });

      await runSpaContentScript(parentCtx, resolved, 'test');

      expect(main).toHaveBeenCalledTimes(1);
    } finally {
      import.meta.env.BROWSER = original;
    }
  });

  it('should throw when there are no match patterns', async () => {
    const { parentCtx, resolved } = setup({ matches: [] });

    await expect(
      runSpaContentScript(parentCtx, resolved, 'test'),
    ).rejects.toThrow('requires at least one match pattern');
  });

  it('should keep handling URL changes after main crashes', async () => {
    setUrl('https://www.youtube.com/watch?v=1');
    const main = vi
      .fn()
      .mockRejectedValueOnce(Error('boom'))
      .mockResolvedValue(undefined);
    const { parentCtx, resolved } = setup({ main });

    await expect(
      runSpaContentScript(parentCtx, resolved, 'test'),
    ).rejects.toThrow('boom');

    await navigate('https://www.youtube.com/watch?v=2');

    expect(main).toHaveBeenCalledTimes(2);
  });
});
