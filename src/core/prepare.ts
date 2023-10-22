import { InlineConfig } from '~/types';
import {
  findEntrypoints,
  generateTypesDir,
  getInternalConfig,
} from '~/core/utils/building';

export async function prepare(config: InlineConfig) {
  const internalConfig = await getInternalConfig(config, 'build');

  internalConfig.logger.info('Generating types...');

  const entrypoints = await findEntrypoints(internalConfig);
  await generateTypesDir(entrypoints, internalConfig);
}
