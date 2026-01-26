import { ExtensionRunner } from '../../types';
import { createWslRunner } from './wsl';
import { createWebExtRunner } from './web-ext';
import { createSafariRunner } from './safari';
import { createManualRunner } from './manual';
import { createWxtRunner } from './wxt-runner';
import { hasGuiDisplay, isWsl } from '../utils/wsl';
import { wxt } from '../wxt';
import { KNOWN_BROWSER_PATHS, type KnownTarget } from '@wxt-dev/runner';

const KNOWN_TARGETS = new Set<string>(Object.keys(KNOWN_BROWSER_PATHS));
function isKnownTarget(browser: string): browser is KnownTarget {
  return KNOWN_TARGETS.has(browser);
}

export async function createExtensionRunner(): Promise<ExtensionRunner> {
  if (wxt.config.browser === 'safari') return createSafariRunner();

  if (wxt.config.runnerConfig.config?.disabled) return createManualRunner();

  const runningInWsl = await isWsl();
  const hasGui = hasGuiDisplay();
  if (runningInWsl && !hasGui) return createWslRunner();

  // When running in WSL with a GUI (WSLg, VcXsrv, X410, etc.), prefer WXT's own runner
  // for browsers supported by @wxt-dev/runner. This avoids web-ext-run / chrome-launcher
  // WSL path rewriting (e.g. \\wsl.localhost\...) and keeps temp/profile directories
  // on the Linux filesystem.
  if (runningInWsl && hasGui && isKnownTarget(wxt.config.browser)) {
    return createWxtRunner();
  }

  return createWebExtRunner();
}
