import { ContentScriptDefinition } from '~/types';
import { browser } from '~/browser';
import { logger } from '~/client/utils/logger';

/**
 * Implements [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).
 * Used to detect and stop content script code when the script is invalidated.
 *
 * It also provides several utilities like `ctx.setTimeout` and `ctx.setInterval` that should be used in
 * content scripts instead of `window.setTimeout` or `window.setInterval`.
 */
export class ContentScriptContext implements AbortController {
  private static SCRIPT_STARTED_MESSAGE_TYPE = 'wxt:content-script-started';

  #isTopFrame = window.self === window.top;
  #abortController: AbortController;

  constructor(
    private readonly contentScriptName: string,
    public readonly options?: Omit<ContentScriptDefinition, 'main'>,
  ) {
    this.#abortController = new AbortController();
    if (this.#isTopFrame) {
      this.#stopOldScripts();
    }
    this.setTimeout(() => {
      // Run on next tick so the listener it adds isn't triggered by stopOldScript
      this.#listenForNewerScripts();
    });
  }

  get signal() {
    return this.#abortController.signal;
  }

  abort(reason?: any): void {
    return this.#abortController.abort(reason);
  }

  get isInvalid(): boolean {
    if (browser.runtime.id == null) {
      this.notifyInvalidated(); // Sets `signal.aborted` to true
    }
    return this.signal.aborted;
  }

  get isValid(): boolean {
    return !this.isInvalid;
  }

  /**
   * Add a listener that is called when the content script's context is invalidated.
   *
   * @returns A function to remove the listener.
   *
   * @example
   * browser.runtime.onMessage.addListener(cb);
   * const removeInvalidatedListener = ctx.onInvalidated(() => {
   *   browser.runtime.onMessage.removeListener(cb);
   * })
   * // ...
   * removeInvalidatedListener();
   */
  onInvalidated(cb: () => void): () => void {
    this.signal.addEventListener('abort', cb);
    return () => this.signal.removeEventListener('abort', cb);
  }

  /**
   * Return a promise that never resolves. Useful if you have an async function that shouldn't run
   * after the context is expired.
   *
   * @example
   * const getValueFromStorage = async () => {
   *   if (ctx.isInvalid) return ctx.block();
   *
   *   // ...
   * }
   */
  block<T>(): Promise<T> {
    return new Promise(() => {
      // noop
    });
  }

  /**
   * Wrapper around `window.setInterval` that automatically clears the interval when invalidated.
   */
  setInterval(handler: () => void, timeout?: number): number {
    const id = setInterval(() => {
      if (this.isValid) handler();
    }, timeout) as unknown as number;
    this.onInvalidated(() => clearInterval(id));
    return id;
  }

  /**
   * Wrapper around `window.setTimeout` that automatically clears the interval when invalidated.
   */
  setTimeout(handler: () => void, timeout?: number): number {
    const id = setTimeout(() => {
      if (this.isValid) handler();
    }, timeout) as unknown as number;
    this.onInvalidated(() => clearTimeout(id));
    return id;
  }

  /**
   * Wrapper around `window.requestAnimationFrame` that automatically cancels the request when
   * invalidated.
   */
  requestAnimationFrame(callback: FrameRequestCallback): number {
    const id = requestAnimationFrame((...args) => {
      if (this.isValid) callback(...args);
    });

    this.onInvalidated(() => cancelAnimationFrame(id));
    return id;
  }

  /**
   * Wrapper around `window.requestIdleCallback` that automatically cancels the request when
   * invalidated.
   */
  requestIdleCallback(
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ): number {
    const id = requestIdleCallback((...args) => {
      if (!this.signal.aborted) callback(...args);
    }, options);

    this.onInvalidated(() => cancelIdleCallback(id));
    return id;
  }

  /**
   * Call `target.addEventListener` and remove the event listener when the context is invalidated.
   *
   * @example
   * ctx.addEventListener(window, "mousemove", () => {
   *   // ...
   * });
   * ctx.addEventListener(document, "visibilitychange", () => {
   *   // ...
   * });
   */
  addEventListener(
    target: any,
    type: string,
    handler: (event: Event) => void,
    options?: AddEventListenerOptions,
  ) {
    target.addEventListener?.(type, handler, options);
    this.onInvalidated(
      () => target.removeEventListener?.(type, handler, options),
    );
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

  #stopOldScripts() {
    // Use postMessage so it get's sent to all the frames of the page.
    window.postMessage(
      {
        event: ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE,
        contentScriptName: this.contentScriptName,
      },
      '*',
    );
  }

  #listenForNewerScripts() {
    const cb = (event: MessageEvent) => {
      if (
        event.data?.type === ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE &&
        event.data?.contentScriptName === this.contentScriptName
      ) {
        this.notifyInvalidated();
      }
    };

    addEventListener('message', cb);
    this.onInvalidated(() => removeEventListener('message', cb));
  }
}
