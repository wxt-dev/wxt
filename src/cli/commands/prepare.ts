import { getInternalConfig } from '../../core/utils/getInternalConfig';
import { findEntrypoints } from '../../core/build/findEntrypoints';
import { generateTypesDir } from '../../core/build/generateTypesDir';
import { defineCommand } from '../utils/defineCommand';
import * as wxt from '../..';

export const prepare = defineCommand<
  [
    root: string | undefined,
    flags: {
      config?: string;
    },
  ]
>(async (root, flags) => {
  const cliConfig: wxt.InlineConfig = {
    root,
    configFile: flags.config,
  };
  const config = await getInternalConfig(cliConfig, 'build');

  config.logger.info('Generating types...');

  const entrypoints = await findEntrypoints(config);
  await generateTypesDir(entrypoints, config);
});
