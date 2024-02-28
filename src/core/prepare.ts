import { InlineConfig } from '~/types';
import { findEntrypoints, generateTypesDir } from '~/core/utils/building';
import { registerWxt, wxt } from './wxt';

export async function prepare(config: InlineConfig) {
  await registerWxt('build', config);
  wxt.logger.info('Generating types...');

  const entrypoints = await findEntrypoints();
  await generateTypesDir(entrypoints);
}
