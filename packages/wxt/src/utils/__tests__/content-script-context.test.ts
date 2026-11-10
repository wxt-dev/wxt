/** @vitest-environment happy-dom */

import { fakeBrowser } from '@webext-core/fake-browser';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ContentScriptContext } from '../content-script-context';

/**
 * When dispatching events on document/window/etc, they are fired on the next
 * tick of the event loop. So waiting a timeout of 0 will ensure they've been
 * fired.
 */
function waitForEventsToFire() {
  return new Promise((res) => setTimeout(res));
}

describe('Content Script Context', () => {
  beforeEach(() => {
    vi.useRealTimers();
    fakeBrowser.runtime.id = 'anything';
  });

  it("should recognize when the content script has lost it's connection to the extension API", () => {
    const ctx = new ContentScriptContext('test');
    const onInvalidated = vi.fn();

    ctx.onInvalidated(onInvalidated);
    // @ts-expect-error Deleting `runtime.id` to simulate disconnection
    delete fakeBrowser.runtime.id;
    const isValid = ctx.isValid;

    expect(onInvalidated).toHaveBeenCalled();
    expect(isValid).toBe(false);
  });

  it('should not throw when browser.runtime is undefined (extension context fully invalidated)', () => {
    const ctx = new ContentScriptContext('test');
    const onInvalidated = vi.fn();

    ctx.onInvalidated(onInvalidated);
    // Simulate complete extension context invalidation where browser.runtime becomes undefined
    const originalRuntime = fakeBrowser.runtime;
    // @ts-ignore
    fakeBrowser.runtime = undefined;

    // Should not throw, and should mark as invalid
    expect(() => ctx.isInvalid).not.toThrow();
    expect(ctx.isInvalid).toBe(true);
    expect(onInvalidated).toHaveBeenCalled();

    // Restore for other tests
    fakeBrowser.runtime = originalRuntime;
  });

  it('should invalidate the current content script when a new context is created', async () => {
    const name = 'test';
    const onInvalidated = vi.fn();
    const ctx = new ContentScriptContext(name);
    ctx.onInvalidated(onInvalidated);

    // Wait for events to run before next tick next tick
    await waitForEventsToFire();

    // Create a new context after first is initialized, and wait for it to initialize
    new ContentScriptContext(name);
    await waitForEventsToFire();

    expect(onInvalidated).toHaveBeenCalled();
    expect(ctx.isValid).toBe(false);
  });

  it('should not invalidate the current content script when a new context is created with a different name', async () => {
    const onInvalidated = vi.fn();
    const ctx = new ContentScriptContext('test1');
    ctx.onInvalidated(onInvalidated);

    // Wait for events to run before next tick next tick
    await waitForEventsToFire();

    // Create a new context after first is initialized, and wait for it to initialize
    new ContentScriptContext('test2');
    await waitForEventsToFire();

    expect(onInvalidated).not.toHaveBeenCalled();
    expect(ctx.isValid).toBe(true);
  });

  describe('noScriptStartedPostMessage', () => {
    it('should send window.postMessage by default', async () => {
      const postMessageSpy = vi.spyOn(window, 'postMessage');
      new ContentScriptContext('test');
      expect(postMessageSpy).toHaveBeenCalledOnce();
      postMessageSpy.mockRestore();
    });

    it('should not send window.postMessage when noScriptStartedPostMessage is true', async () => {
      const postMessageSpy = vi.spyOn(window, 'postMessage');
      new ContentScriptContext('test', { noScriptStartedPostMessage: true });
      expect(postMessageSpy).not.toHaveBeenCalled();
      postMessageSpy.mockRestore();
    });
  });

  describe('addEventListener', () => {
    const context = new ContentScriptContext('test');
    it('should infer types correctly for the window target', () => {
      context.addEventListener(window, 'DOMContentLoaded', (_) => {});
      context.addEventListener(window, 'orientationchange', (_) => {});
      context.addEventListener(window, 'wxt:locationchange', (_) => {});
      // @ts-expect-error
      context.addEventListener(window, 'visibilitychange', (_) => {});
    });

    it('should infer types correctly for the document target', () => {
      context.addEventListener(document, 'visibilitychange', (_) => {});
      context.addEventListener(document, 'readystatechange', (_) => {});
    });

    it('should infer types correctly for HTML element targets', () => {
      const button = document.createElement('button');
      context.addEventListener(button, 'click', (_) => {});
      context.addEventListener(button, 'mouseover', (_) => {});
    });
  });

  describe('applyPatch', () => {
    it('should throw when the content script runs in the "MAIN" world', () => {
      const ctx = new ContentScriptContext('test', { world: 'MAIN' });
      expect(() => ctx.applyPatch()).toThrow();
    });

    it('should patch setTimeout so plain calls stop firing after invalidation', async () => {
      const ctx = new ContentScriptContext('test');
      const restore = ctx.applyPatch();
      const handler = vi.fn();

      setTimeout(handler, 10);
      ctx.notifyInvalidated();
      await new Promise((res) => setTimeout(res, 20));

      expect(handler).not.toHaveBeenCalled();
      restore();
    });

    it('should patch addEventListener so plain listeners are removed after invalidation', () => {
      const ctx = new ContentScriptContext('test');
      const restore = ctx.applyPatch();
      const handler = vi.fn();

      addEventListener('visibilitychange', handler);
      ctx.notifyInvalidated();
      window.dispatchEvent(new Event('visibilitychange'));

      expect(handler).not.toHaveBeenCalled();
      restore();
    });

    it('should be idempotent, returning the same restore function', () => {
      const ctx = new ContentScriptContext('test');
      const restore1 = ctx.applyPatch();
      const restore2 = ctx.applyPatch();

      expect(restore1).toBe(restore2);
      restore1();
    });

    it('should restore the original functions when called', () => {
      const originalSetTimeout = window.setTimeout;
      const ctx = new ContentScriptContext('test');
      const restore = ctx.applyPatch();

      expect(window.setTimeout).not.toBe(originalSetTimeout);
      restore();
      expect(window.setTimeout).toBe(originalSetTimeout);
    });

    it('should automatically restore when the context is invalidated', () => {
      const originalSetTimeout = window.setTimeout;
      const ctx = new ContentScriptContext('test');
      ctx.applyPatch();

      ctx.notifyInvalidated();

      expect(window.setTimeout).toBe(originalSetTimeout);
    });

    // Regression test: ctx.setTimeout/setInterval/requestAnimationFrame/
    // requestIdleCallback/addEventListener all call the global API internally.
    // Once applyPatch replaces that global API with a wrapper that calls back
    // into the ctx method, calling the ctx method directly (not just through
    // the patched global) used to recurse infinitely.
    it('should not recurse infinitely when ctx.setTimeout is called directly while patched', async () => {
      const ctx = new ContentScriptContext('test');
      const restore = ctx.applyPatch();
      const handler = vi.fn();

      expect(() => ctx.setTimeout(handler, 0)).not.toThrow();
      await new Promise((res) => setTimeout(res, 10));

      expect(handler).toHaveBeenCalledTimes(1);
      restore();
    });

    it('should not recurse infinitely when ctx.addEventListener is called directly while patched', () => {
      const ctx = new ContentScriptContext('test');
      const restore = ctx.applyPatch();
      const handler = vi.fn();

      expect(() =>
        ctx.addEventListener(window, 'resize', handler),
      ).not.toThrow();
      window.dispatchEvent(new Event('resize'));

      expect(handler).toHaveBeenCalledTimes(1);
      restore();
    });
  });
});
