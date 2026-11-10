/** @module wxt/utils/content-script-context */
import { browser } from 'wxt/browser';

import { ContentScriptDefinition } from '../types';
import {
  type WxtLocationChangeEvent,
  getUniqueEventName,
} from './internal/custom-events';
import { createLocationWatcher } from './internal/location-watcher';
import { logger } from './internal/logger';

export type { WxtLocationChangeEvent };

/**
 * Implements
 * [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).
 * Used to detect and stop content script code when the script is invalidated.
 *
 * It also provides several utilities like `ctx.setTimeout` and
 * `ctx.setInterval` that should be used in content scripts instead of
 * `window.setTimeout` or `window.setInterval`.
 *
 * To create context for testing, you can use the class's constructor:
 *
 * ```ts
 * import { ContentScriptContext } from 'wxt/utils/content-scripts-context';
 *
 * test('storage listener should be removed when context is invalidated', () => {
 *   const ctx = new ContentScriptContext('test');
 *   const item = storage.defineItem('local:count', { defaultValue: 0 });
 *   const watcher = vi.fn();
 *
 *   const unwatch = item.watch(watcher);
 *   ctx.onInvalidated(unwatch); // Listen for invalidate here
 *
 *   await item.setValue(1);
 *   expect(watcher).toBeCalledTimes(1);
 *   expect(watcher).toBeCalledWith(1, 0);
 *
 *   ctx.notifyInvalidated(); // Use this function to invalidate the context
 *   await item.setValue(2);
 *   expect(watcher).toBeCalledTimes(1);
 * });
 * ```
 */
export class ContentScriptContext implements AbortController {
  private static SCRIPT_STARTED_MESSAGE_TYPE = getUniqueEventName(
    'wxt:content-script-started',
  );
  private static patchedWindows = new WeakMap<Window, () => void>();
  /**
   * Pre-patch implementations, bound to `target`, so `ctx`'s methods can bypass
   * the patch instead of recursing into it.
   */
  private static unpatchedImpls = new WeakMap<
    Window,
    {
      setTimeout: Window['setTimeout'];
      setInterval: Window['setInterval'];
      requestAnimationFrame: Window['requestAnimationFrame'];
      requestIdleCallback?: Window['requestIdleCallback'];
      addEventListener: Window['addEventListener'];
    }
  >();

  private id: string;
  private abortController: AbortController;
  private locationWatcher = createLocationWatcher(this);

  constructor(
    private readonly contentScriptName: string,
    public readonly options?: Omit<ContentScriptDefinition, 'main'>,
  ) {
    this.id = Math.random().toString(36).slice(2);
    this.abortController = new AbortController();

    this.stopOldScripts();
    this.listenForNewerScripts();
  }

  get signal() {
    return this.abortController.signal;
  }

  abort(reason?: any): void {
    return this.abortController.abort(reason);
  }

  get isInvalid(): boolean {
    if (browser.runtime?.id == null) {
      this.notifyInvalidated(); // Sets `signal.aborted` to true
    }
    return this.signal.aborted;
  }

  get isValid(): boolean {
    return !this.isInvalid;
  }

  /**
   * Add a listener that is called when the content script's context is
   * invalidated.
   *
   * @example
   *   browser.runtime.onMessage.addListener(cb);
   *   const removeInvalidatedListener = ctx.onInvalidated(() => {
   *     browser.runtime.onMessage.removeListener(cb);
   *   });
   *   // ...
   *   removeInvalidatedListener();
   *
   * @returns A function to remove the listener.
   */
  onInvalidated(cb: () => void): () => void {
    this.signal.addEventListener('abort', cb);
    return () => this.signal.removeEventListener('abort', cb);
  }

  /**
   * Return a promise that never resolves. Useful if you have an async function
   * that shouldn't run after the context is expired.
   *
   * @example
   *   const getValueFromStorage = async () => {
   *     if (ctx.isInvalid) return ctx.block();
   *
   *     // ...
   *   };
   */
  block<T>(): Promise<T> {
    return new Promise(() => {
      // noop
    });
  }

  /**
   * Wrapper around `window.setInterval` that automatically clears the interval
   * when invalidated.
   *
   * Intervals can be cleared by calling the normal `clearInterval` function.
   */
  setInterval(handler: () => void, timeout?: number): number {
    const callback = () => {
      if (this.isValid) handler();
    };
    const unpatched =
      ContentScriptContext.unpatchedImpls.get(window)?.setInterval;
    const id = (unpatched
      ? unpatched(callback, timeout)
      : window.setInterval(callback, timeout)) as unknown as number;
    this.onInvalidated(() => clearInterval(id));
    return id;
  }

  /**
   * Wrapper around `window.setTimeout` that automatically clears the interval
   * when invalidated.
   *
   * Timeouts can be cleared by calling the normal `setTimeout` function.
   */
  setTimeout(handler: () => void, timeout?: number): number {
    const callback = () => {
      if (this.isValid) handler();
    };
    const unpatched =
      ContentScriptContext.unpatchedImpls.get(window)?.setTimeout;
    const id = (unpatched
      ? unpatched(callback, timeout)
      : window.setTimeout(callback, timeout)) as unknown as number;
    this.onInvalidated(() => clearTimeout(id));
    return id;
  }

  /**
   * Wrapper around `window.requestAnimationFrame` that automatically cancels
   * the request when invalidated.
   *
   * Callbacks can be canceled by calling the normal `cancelAnimationFrame`
   * function.
   */
  requestAnimationFrame(callback: FrameRequestCallback): number {
    const frame: FrameRequestCallback = (...args) => {
      if (this.isValid) callback(...args);
    };
    const unpatched =
      ContentScriptContext.unpatchedImpls.get(window)?.requestAnimationFrame;
    const id = unpatched
      ? unpatched(frame)
      : window.requestAnimationFrame(frame);

    this.onInvalidated(() => cancelAnimationFrame(id));
    return id;
  }

  /**
   * Wrapper around `window.requestIdleCallback` that automatically cancels the
   * request when invalidated.
   *
   * Callbacks can be canceled by calling the normal `cancelIdleCallback`
   * function.
   */
  requestIdleCallback(
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ): number {
    const idle: IdleRequestCallback = (...args) => {
      if (!this.signal.aborted) callback(...args);
    };
    const unpatched =
      ContentScriptContext.unpatchedImpls.get(window)?.requestIdleCallback;
    const id = unpatched
      ? unpatched(idle, options)
      : window.requestIdleCallback(idle, options);

    this.onInvalidated(() => cancelIdleCallback(id));
    return id;
  }

  /**
   * Call `target.addEventListener` and remove the event listener when the
   * context is invalidated.
   *
   * Listeners can be canceled by calling the normal `removeEventListener`
   * function.
   *
   * Includes additional events useful for content scripts:
   *
   * - `"wxt:locationchange"` - Triggered when HTML5 history mode is used to
   *   change URL. Content scripts are not reloaded when navigating this way, so
   *   this can be used to reset the content script state on URL change, or run
   *   custom code.
   *
   * @example
   *   ctx.addEventListener(document, 'visibilitychange', () => {
   *     // ...
   *   });
   *   ctx.addEventListener(window, 'wxt:locationchange', () => {
   *     // ...
   *   });
   */
  addEventListener<TType extends keyof WxtWindowEventMap>(
    target: Window,
    type: TType,
    handler: (event: WxtWindowEventMap[TType]) => void,
    options?: AddEventListenerOptions,
  ): void;
  addEventListener<TType extends keyof DocumentEventMap>(
    target: Document,
    type: TType,
    handler: (event: DocumentEventMap[TType]) => void,
    options?: AddEventListenerOptions,
  ): void;
  addEventListener<TTarget extends EventTarget>(
    target: TTarget,
    ...params: Parameters<TTarget['addEventListener']>
  ): void;
  addEventListener(
    target: EventTarget,
    type: string,
    handler: (event: Event) => void,
    options?: AddEventListenerOptions,
  ): void {
    if (type === 'wxt:locationchange') {
      // Start the location watcher when adding the event for the first time
      if (this.isValid) this.locationWatcher.run();
    }

    const finalType = type.startsWith('wxt:') ? getUniqueEventName(type) : type;
    const finalOptions = { ...options, signal: this.signal };
    const unpatched = ContentScriptContext.unpatchedImpls.get(
      target as Window,
    )?.addEventListener;

    if (unpatched) {
      unpatched(finalType, handler, finalOptions);
    } else {
      target.addEventListener?.(finalType, handler, finalOptions);
    }
  }

  /**
   * Patches `target`'s timer and event listener APIs (`setTimeout`,
   * `setInterval`, `requestAnimationFrame`, `requestIdleCallback`,
   * `addEventListener`) so plain calls behave like their `ctx`-aware
   * counterparts, automatically cleaning up when this context is invalidated.
   *
   * :::tip Only supported in the `"ISOLATED"` world. In the `"MAIN"` world,
   * `window` is the page's real global object, shared with the page itself and
   * other extensions - patching it there could break them, so `applyPatch`
   * don't work in it. :::
   *
   * @example
   *   ctx.applyPatch(otherWindow);
   *
   * @param target - The `window` to patch. Defaults to the global `window`.
   * @returns A function that restores the original, unpatched functions.
   */
  applyPatch(target: Window = window): () => void {
    if (this.options?.world === 'MAIN') {
      throw Error(
        'ctx.applyPatch is not supported in the "MAIN" world, because `window` is shared with the page and other extensions there.',
      );
    }

    const existingRestore = ContentScriptContext.patchedWindows.get(target);
    if (existingRestore) {
      return existingRestore;
    }

    const originals = {
      setTimeout: target.setTimeout,
      setInterval: target.setInterval,
      requestAnimationFrame: target.requestAnimationFrame,
      requestIdleCallback: target.requestIdleCallback,
      addEventListener: target.addEventListener,
    };

    ContentScriptContext.unpatchedImpls.set(target, {
      setTimeout: originals.setTimeout.bind(target),
      setInterval: originals.setInterval.bind(target),
      requestAnimationFrame: originals.requestAnimationFrame.bind(target),
      requestIdleCallback: originals.requestIdleCallback?.bind(target),
      addEventListener: originals.addEventListener.bind(target),
    });

    target.setTimeout = ((handler: TimerHandler, timeout?: number) => {
      return this.setTimeout(handler as () => void, timeout);
    }) as typeof target.setTimeout;

    target.setInterval = ((handler: TimerHandler, timeout?: number) => {
      return this.setInterval(handler as () => void, timeout);
    }) as typeof target.setInterval;

    target.requestAnimationFrame = ((callback: FrameRequestCallback) => {
      return this.requestAnimationFrame(callback);
    }) as typeof target.requestAnimationFrame;

    target.requestIdleCallback = ((
      callback: IdleRequestCallback,
      options?: IdleRequestOptions,
    ) => {
      return this.requestIdleCallback(callback, options);
    }) as typeof target.requestIdleCallback;

    target.addEventListener = ((
      type: string,
      handler: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) =>
      this.addEventListener(
        target,
        type as any,
        typeof handler === 'function'
          ? handler
          : handler.handleEvent.bind(handler),
        typeof options === 'object' ? options : undefined,
      )) as typeof target.addEventListener;

    const restore = () => {
      Object.assign(target, originals);
      ContentScriptContext.patchedWindows.delete(target);
      ContentScriptContext.unpatchedImpls.delete(target);
    };
    ContentScriptContext.patchedWindows.set(target, restore);
    this.onInvalidated(restore);
    return restore;
  }

  /**
   * @internal
   * Abort the abort controller and execute all `onInvalidated` listeners.
   */
  notifyInvalidated() {
    this.abort('Content script context invalidated');
    logger.debug(
      `Content script "${this.contentScriptName}" context invalidated`,
    );
  }

  stopOldScripts() {
    document.dispatchEvent(
      new CustomEvent(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, {
        detail: {
          contentScriptName: this.contentScriptName,
          messageId: this.id,
        },
      }),
    );

    if (!this.options?.noScriptStartedPostMessage) {
      // Send message using `window.postMessage` for backwards compatibility to invalidate old versions before WXT changed to `document.dispatchEvent`
      // TODO: Remove this once WXT version using `document.dispatchEvent` has been released for a while
      window.postMessage(
        {
          type: ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE,
          contentScriptName: this.contentScriptName,
          messageId: this.id,
        },
        '*',
      );
    }
  }

  verifyScriptStartedEvent(event: CustomEvent) {
    const isSameContentScript =
      event.detail?.contentScriptName === this.contentScriptName;
    // Handle case where website dispatches the event again for some reason
    const isFromSelf = event.detail?.messageId === this.id;
    return isSameContentScript && !isFromSelf;
  }

  listenForNewerScripts() {
    const cb: EventListener = (event) => {
      if (
        !(event instanceof CustomEvent) ||
        !this.verifyScriptStartedEvent(event)
      ) {
        return;
      }
      this.notifyInvalidated();
    };

    document.addEventListener(
      ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE,
      cb,
    );
    this.onInvalidated(() =>
      document.removeEventListener(
        ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE,
        cb,
      ),
    );
  }
}

export interface WxtWindowEventMap extends WindowEventMap {
  'wxt:locationchange': WxtLocationChangeEvent;
}
