import dns from 'node:dns';

import consola from 'consola';

import type { ResolvedConfig } from '../types';
import { withTimeout } from './time-utils';

const isOffline = async (): Promise<boolean> => {
  try {
    const isOffline = new Promise<boolean>((res) => {
      dns.resolve('google.com', (err) => res(err != null));
    });
    return await withTimeout(isOffline, 1e3);
  } catch (error) {
    consola.error('Error checking offline status:', error);
    return true;
  }
};

export const isOnline = async (): Promise<boolean> => {
  const offline = await isOffline();
  return !offline;
};

/**
 * Fetches a URL with a simple GET request. Grabs it from cache if it doesn't
 * exist, or throws an error if it can't be resolved via the network or cache.
 */
export const fetchCached = async (
  url: string,
  config: ResolvedConfig,
): Promise<string> => {
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
};
