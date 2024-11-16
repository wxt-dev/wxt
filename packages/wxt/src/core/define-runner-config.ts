import consola from 'consola';
import { WebExtRunnerConfig } from '../types';

/**
 * @deprecated Use `defineWebExtConfig` instead. Same function, different name.
 */
export function defineRunnerConfig(
  config: WebExtRunnerConfig,
): WebExtRunnerConfig {
  consola.warn(
    'defineRunnerConfig is deprecated, replace it with defineWebExtConfig',
  );
  return config;
}

/**
 * Configure how [`web-ext`](https://github.com/mozilla/web-ext) starts the browser during development.
 */
export function defineWebExtConfig(
  config: WebExtRunnerConfig,
): WebExtRunnerConfig {
  return config;
}
