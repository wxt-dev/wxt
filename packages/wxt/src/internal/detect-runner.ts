import { ExtensionRunner, ResolvedConfig } from '../types';
import { ManualRunner } from './runners/manual';
import { WebExtRunner } from './runners/web-ext';
import { withFirstModule } from '../internal-utils/module-utils';

export async function detectRunner(
  config: ResolvedConfig,
): Promise<ExtensionRunner> {
  return withFirstModule(
    async () => {
      const webExt = await import('web-ext').then((mod) => mod.default);
      const logger = await import('web-ext/util/logger');
      return new WebExtRunner(webExt, logger, config);
    },
    () => new ManualRunner(config),
  );
}
