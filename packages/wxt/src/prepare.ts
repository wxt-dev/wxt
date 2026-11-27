import { findEntrypoints } from './internal/find-entrypoints';
import { generateWxtDir } from './internal/generate-wxt-dir';
import { registerWxt, wxt } from './internal/wxt';
import { InlineConfig } from './types';

// #region snippet
export async function prepare(config: InlineConfig) {
  await registerWxt('build', config);
  wxt.logger.info('Generating types...');

  const entrypoints = await findEntrypoints();
  await generateWxtDir(entrypoints);
}
// #endregion snippet
