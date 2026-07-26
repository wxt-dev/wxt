import dns from 'node:dns';
import { ResolvedConfig } from '../../types';
import { withTimeout } from './time';
import consola from 'consola';

async function isOffline(): Promise<boolean> {
  try {
    const isOffline = new Promise<boolean>((res) => {
      dns.resolve('google.com', (err) => res(err != null));
    });
    return await withTimeout(isOffline, 1e3);
  } catch (error) {
    consola.error('Error checking offline status:', error);
    return true;
  }
}

export async function isOnline(): Promise<boolean> {
  const offline = await isOffline();
  return !offline;
}

export interface FetchCachedOptions {
  /**
   * Called with content before it is cached or returned. Throw to reject it.
   * Rejected downloads fall back to the cache, and rejected cache entries are
   * never returned.
   */
  verify?: (content: string) => void;
  /** Skip reading from and writing to the cache. */
  noCache?: boolean;
}

/**
 * Fetches a URL with a simple GET request. Grabs it from cache if it doesn't
 * exist, or throws an error if it can't be resolved via the network or cache.
 */
export async function fetchCached(
  url: string,
  config: ResolvedConfig,
  { verify, noCache }: FetchCachedOptions = {},
): Promise<string> {
  let content: string = '';
  let verifyError: unknown;

  if (await isOnline()) {
    const downloaded = await download(url, config);
    if (downloaded != null) {
      try {
        verify?.(downloaded);
        content = downloaded;
      } catch (err) {
        verifyError = err;
        config.logger.debug(
          `Downloaded "${url}", but it failed verification, falling back to cache...`,
        );
      }
      if (content && !noCache) await config.fsCache.set(url, content);
    }
  }

  if (!content && !noCache) {
    const cached = (await config.fsCache.get(url)) ?? '';
    if (cached) {
      verify?.(cached);
      content = cached;
    }
  }

  if (!content) {
    if (verifyError) throw verifyError;
    throw Error(
      `Offline and "${url}" has not been cached. Try again when online.`,
    );
  }

  return content;
}

/**
 * Downloads a URL, returning `undefined` if it can't be retrieved for any
 * reason: a bad status, a refused connection, or a request that dies partway
 * through reading the body.
 */
async function download(
  url: string,
  config: ResolvedConfig,
): Promise<string | undefined> {
  try {
    const res = await fetch(url);
    if (res.status < 300) return await res.text();
  } catch {
    // Fall through to the same debug log as a bad status.
  }
  config.logger.debug(`Failed to download "${url}", falling back to cache...`);
}
