import type { WebExtConfig } from './types';

/**
 * Configure how [`web-ext`](https://github.com/mozilla/web-ext) starts the
 * browser during development.
 */
export const defineWebExtConfig = (config: WebExtConfig): WebExtConfig => {
  return config;
};
