import consola from 'consola';
import { WebExtConfig } from '../types';

/**
 * @deprecated Use `defineWebExtConfig` instead. Same function, different name.
 */
export function defineRunnerConfig(config: WebExtConfig): WebExtConfig {
  consola.warn(
    'defineRunnerConfig is deprecated, replace it with defineWebExtConfig',
  );
  return config;
}

/**
 * Configure how [`web-ext`](https://github.com/mozilla/web-ext) starts the browser during development.
 */
export function defineWebExtConfig(config: WebExtConfig): WebExtConfig {
  return config;
}
