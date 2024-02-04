import { BuildOutput, InlineConfig } from '~/types';
import { resolveConfig, internalBuild } from './utils/building';
import { registerWxt } from './utils/wxt';

/**
 * Bundles the extension for production. Returns a promise of the build result. Discovers the `wxt.config.ts` file in
 * the root directory, and merges that config with what is passed in.
 *
 * @example
 * // Use config from `wxt.config.ts`
 * const res = await build()
 *
 * // or override config `from wxt.config.ts`
 * const res = await build({
 *   // Override config...
 * })
 */
export async function build(config?: InlineConfig): Promise<BuildOutput> {
  await registerWxt(await resolveConfig(config ?? {}, 'build'));

  return await internalBuild();
}
