import type { AnymatchPattern } from 'vite';
import type { ResolvedConfig, WxtWatchOptions } from '../../types';

export function resolveWatchOptions(
  config: ResolvedConfig,
  viteWatchOptions?: WxtWatchOptions | null,
): WxtWatchOptions {
  return {
    ...viteWatchOptions,
    ...config.watchOptions,
    ignored: [
      `${config.outBaseDir}/**`,
      `${config.wxtDir}/**`,
      ...normalizeIgnored(viteWatchOptions?.ignored),
      ...normalizeIgnored(config.watchOptions?.ignored),
    ],
  };
}

function normalizeIgnored(
  ignored: WxtWatchOptions['ignored'] | undefined,
): AnymatchPattern[] {
  if (ignored == null) return [];
  return Array.isArray(ignored) ? ignored : [ignored];
}
