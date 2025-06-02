import { ExtensionRunner } from '../../types';
import { createWslRunner } from './wsl';
import { createWxtRunner } from './wxt';
import { createSafariRunner } from './safari';
import { createManualRunner } from './manual';
import { isWsl } from '../utils/wsl';
import { wxt } from '../wxt';

export async function createExtensionRunner(): Promise<ExtensionRunner> {
  if (wxt.config.browser === 'safari') return createSafariRunner();

  if (wxt.config.browser === 'firefox' && wxt.config.manifestVersion === 3) {
    throw Error(
      'Dev mode does not support Firefox MV3. For alternatives, see https://github.com/wxt-dev/wxt/issues/230#issuecomment-1806881653',
    );
  }

  if (await isWsl()) return createWslRunner();
  if (wxt.config.runnerConfig.config?.disabled) return createManualRunner();

  return createWxtRunner();
}
