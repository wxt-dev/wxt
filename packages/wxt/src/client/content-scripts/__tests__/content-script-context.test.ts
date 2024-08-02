/** @vitest-environment happy-dom */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContentScriptContext } from '..';
import { fakeBrowser } from '@webext-core/fake-browser';
import { sleep } from '../../../core/utils/time';

describe('Content Script Context', () => {
  beforeEach(() => {
    vi.useRealTimers();
    fakeBrowser.runtime.id = 'anything';
  });

  it("should recognize when the content script has lost it's connection to the extension API", () => {
    const ctx = new ContentScriptContext('test');
    const onInvalidated = vi.fn();

    ctx.onInvalidated(onInvalidated);
    // @ts-expect-error
    delete fakeBrowser.runtime.id;
    const isValid = ctx.isValid;

    expect(onInvalidated).toBeCalled();
    expect(isValid).toBe(false);
  });

  it('should invalidate the current content script when a new context is created', async () => {
    const name = 'test';
    const onInvalidated = vi.fn();
    const ctx = new ContentScriptContext(name);
    ctx.onInvalidated(onInvalidated);

    // Wait for events to run before next tick next tick
    await sleep(0);

    // Create a new context after first is initialized, and wait for it to initialize
    new ContentScriptContext(name);
    await sleep(0);

    expect(onInvalidated).toBeCalled();
    expect(ctx.isValid).toBe(false);
  });

  it('should not invalidate the current content script when a new context is created with a different name', async () => {
    const onInvalidated = vi.fn();
    const ctx = new ContentScriptContext('test1');
    ctx.onInvalidated(onInvalidated);

    // Wait for events to run before next tick next tick
    await sleep(0);

    // Create a new context after first is initialized, and wait for it to initialize
    new ContentScriptContext('test2');
    await sleep(0);

    expect(onInvalidated).not.toBeCalled();
    expect(ctx.isValid).toBe(true);
  });
});
