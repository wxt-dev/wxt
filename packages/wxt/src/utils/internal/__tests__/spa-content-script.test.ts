/** @vitest-environment happy-dom */
/** @vitest-environment-options {"url": "https://example.com/home"} */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from '@webext-core/fake-browser';
import { runContentScriptWithSpaSupport } from '../spa-content-script';
import { ContentScriptContext } from '../../content-script-context';

function waitForEventsToFire() {
  return new Promise((res) => setTimeout(res));
}

function dispatchLocationChange(newUrl: string, oldUrl: string) {
  window.dispatchEvent(
    Object.assign(
      new Event(`${fakeBrowser.runtime.id}:undefined:wxt:locationchange`),
      {
        newUrl: new URL(newUrl),
        oldUrl: new URL(oldUrl),
      },
    ),
  );
}

describe('runContentScriptWithSpaSupport', () => {
  beforeEach(() => {
    vi.useRealTimers();
    fakeBrowser.runtime.id = 'anything';
    window.history.replaceState(null, '', '/home');
  });

  it('should run on matching URLs and abort the previous child context when navigating', async () => {
    const parentContext = new ContentScriptContext('content');
    const childInvalidated = vi.fn();
    const main = vi.fn((ctx: ContentScriptContext) => {
      ctx.onInvalidated(childInvalidated);
    });

    runContentScriptWithSpaSupport(parentContext, {
      matches: ['https://example.com/app/*'],
      spa: true,
      main,
    });

    expect(main).not.toHaveBeenCalled();

    dispatchLocationChange(
      'https://example.com/app/one',
      'https://example.com/home',
    );
    await waitForEventsToFire();

    expect(main).toHaveBeenCalledTimes(1);
    expect(childInvalidated).not.toHaveBeenCalled();

    dispatchLocationChange(
      'https://example.com/app/two',
      'https://example.com/app/one',
    );
    await waitForEventsToFire();

    expect(main).toHaveBeenCalledTimes(2);
    expect(childInvalidated).toHaveBeenCalledTimes(1);

    dispatchLocationChange(
      'https://example.com/settings',
      'https://example.com/app/two',
    );
    await waitForEventsToFire();

    expect(main).toHaveBeenCalledTimes(2);
    expect(childInvalidated).toHaveBeenCalledTimes(2);
  });
});
