import { InternalConfig } from '../types';
import { ExtensionRunner } from './extension-runner';
import { createWslRunner } from './wsl';
import { createWebExtRunner } from './web-ext';
import { createSafariRunner } from './safari';

export async function createExtensionRunner(
  config: InternalConfig,
): Promise<ExtensionRunner> {
  if (config.browser === 'safari') return createSafariRunner();

  const { default: isWsl } = await import('is-wsl'); // ESM only, requires dynamic import
  console.log({ isWsl });
  if (isWsl) return createWslRunner();

  return createWebExtRunner();
}
