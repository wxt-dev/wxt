import { InternalConfig, ExtensionRunner } from '~/types';
import { createWslRunner } from './wsl';
import { createWebExtRunner } from './web-ext';
import { createSafariRunner } from './safari';
import { createManualRunner } from './manual';
import { isWsl } from '~/core/utils/wsl';

export async function createExtensionRunner(
  config: InternalConfig,
): Promise<ExtensionRunner> {
  if (config.browser === 'safari') return createSafariRunner();

  if (await isWsl()) return createWslRunner();
  if (config.runnerConfig.config?.disabled) return createManualRunner();

  return createWebExtRunner();
}
