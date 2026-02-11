import type { ExtensionRunner } from '../../types';
import { isWsl } from '../utils/wsl';
import { wxt } from '../wxt';
import { createManualRunner } from './manual';
import { createSafariRunner } from './safari';
import { createWebExtRunner } from './web-ext';
import { createWslRunner } from './wsl';

export async function createExtensionRunner(): Promise<ExtensionRunner> {
  if (wxt.config.browser === 'safari') return createSafariRunner();

  if (isWsl()) return createWslRunner();
  if (wxt.config.runnerConfig.config?.disabled) return createManualRunner();

  return createWebExtRunner();
}
