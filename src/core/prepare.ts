import { InlineConfig } from '~/types';
import {
  findEntrypoints,
  generateTypesDir,
  resolveConfig,
} from '~/core/utils/building';
import { registerWxt, wxt } from './utils/wxt';

export async function prepare(config: InlineConfig) {
  await registerWxt(await resolveConfig(config, 'build'));
  wxt.logger.info('Generating types...');

  const entrypoints = await findEntrypoints();
  await generateTypesDir(entrypoints);
}
