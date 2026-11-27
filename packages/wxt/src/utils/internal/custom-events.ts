import { browser } from 'wxt/browser';

/**
 * Returns an event name unique to the extension and content script that's
 * running.
 */
export const getUniqueEventName = (eventName: string): string => {
  return `${browser?.runtime?.id}:${import.meta.env.ENTRYPOINT}:${eventName}`;
};

/**
 * Fired on `window` as `wxt:locationchange` when a content script detects a
 * same-document URL change.
 */
export class WxtLocationChangeEvent extends Event {
  static EVENT_NAME = getUniqueEventName('wxt:locationchange');

  constructor(
    /** The URL after the change. */
    readonly newUrl: URL,
    /** The URL before the change. */
    readonly oldUrl: URL,
  ) {
    super(WxtLocationChangeEvent.EVENT_NAME, {});
  }
}
