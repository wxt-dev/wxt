import dns from 'node:dns';
import { withTimeout } from './promises';
import { InternalConfig } from '../types';

function isOffline(): Promise<boolean> {
  const isOffline = new Promise<boolean>((res) => {
    dns.resolve('google.com', (err) => {
      if (err == null) {
        res(false);
      } else {
        res(true);
      }
    });
  });
  return withTimeout(isOffline, 1e3).catch(() => true);
}

export async function isOnline(): Promise<boolean> {
  const offline = await isOffline();
  return !offline;
}

/**
 * Fetches a URL with a simple GET request. Grabs it from cache if it doesn't exist, or throws an
 * error if it can't be resolved via the network or cache.
 */
export async function fetchCached(
  url: string,
  config: InternalConfig,
): Promise<string> {
  let content: string = '';

  if (await isOnline()) {
    const res = await fetch(url);
    if (res.status < 300) {
      content = await res.text();
      await config.fsCache.set(url, content);
    } else {
      config.logger.debug(
        `Failed to download "${url}", falling back to cache...`,
      );
    }
  }

  if (!content) content = (await config.fsCache.get(url)) ?? '';
  if (!content)
    throw Error(
      `Offline and "${url}" has not been cached. Try again when online.`,
    );

  return content;
}
