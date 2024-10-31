import { InlineConfig } from '../types';
import { findEntrypoints } from './utils/building';
import { generateWxtDir } from './generate-wxt-dir';
import { registerWxt, wxt } from './wxt';

export async function prepare(config: InlineConfig) {
  await registerWxt('build', config);
  wxt.logger.info('Generating types...');

  const entrypoints = await findEntrypoints();
  await generateWxtDir(entrypoints);
}
