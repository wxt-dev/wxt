import { BuildOutput, ExviteDevServer, InlineConfig } from './types';
import * as vite from 'vite';
import { getInternalConfig } from './utils/getInternalConfig';

export * from './types/external';
export * from './utils/defineConfig';

/**
 * Bundles the extension for production. Returns a promise of the build result.
 */
export async function build(config: InlineConfig): Promise<BuildOutput> {
  const internalConfig = await getInternalConfig(config, 'build');
  throw Error('Not implemented');
}

export async function createServer(
  config: InlineConfig,
): Promise<ExviteDevServer> {
  const internalConfig = await getInternalConfig(config, 'serve');
  const server = await vite.createServer(internalConfig.vite);
  throw Error('Not implemented');
}
