import { browser } from '~/browser';

export class WxtLocationChangeEvent extends Event {
  static EVENT_NAME = getUniqueEventName('wxt:locationchange');

  constructor(
    readonly newUrl: URL,
    readonly oldUrl: URL,
  ) {
    super(WxtLocationChangeEvent.EVENT_NAME, {});
  }
}

/**
 * Returns an event name unique to the extension and content script that's running.
 */
export function getUniqueEventName(eventName: string): string {
  // During the build process, __ENTRYPOINT__ is not defined when importing entrypoints to get their
  // metadata.
  const entrypointName =
    typeof __ENTRYPOINT__ === 'undefined' ? 'build' : __ENTRYPOINT__;

  return `${browser.runtime.id}:${entrypointName}:${eventName}`;
}
