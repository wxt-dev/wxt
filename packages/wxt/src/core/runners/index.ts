import { ExtensionRunner } from '../../types';
import { createWslRunner } from './wsl';
import { createWebExtRunner } from './web-ext';
import { createSafariRunner } from './safari';
import { createManualRunner } from './manual';
import { isWsl } from '../utils/wsl';
import { wxt } from '../wxt';

export async function createExtensionRunner(): Promise<ExtensionRunner> {
  if (wxt.config.browser === 'safari') return createSafariRunner();

  if (await isWsl()) return createWslRunner();
  if (wxt.config.runnerConfig.config?.disabled) return createManualRunner();

  return createWebExtRunner();
}
