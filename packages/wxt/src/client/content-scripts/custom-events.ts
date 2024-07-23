import { browser } from '../../browser';

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
  // During the build process, import.meta.env is not defined when importing
  // entrypoints to get their metadata.
  const entrypointName =
    typeof import.meta.env === 'undefined'
      ? 'build'
      : import.meta.env.ENTRYPOINT;

  return `${browser?.runtime?.id}:${entrypointName}:${eventName}`;
}
