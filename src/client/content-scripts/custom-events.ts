import { browser } from '~/browser';
import { ContentScriptContext } from '.';

export class WxtLocationChangeEvent extends Event {
  static getEventName = (ctx: ContentScriptContext) =>
    getUniqueEventName(ctx, 'wxt:locationchange');

  constructor(
    ctx: ContentScriptContext,
    readonly newUrl: URL,
    readonly oldUrl: URL,
  ) {
    super(WxtLocationChangeEvent.getEventName(ctx), {});
  }
}

/**
 * Returns an event name unique to the extension and content script that's running.
 */
export function getUniqueEventName(
  ctx: ContentScriptContext,
  eventName: string,
): string {
  // During the build process, import.meta.env is not defined when importing
  // entrypoints to get their metadata.

  return `${browser.runtime.id}:${ctx.contentScriptName}:${eventName}`;
}
