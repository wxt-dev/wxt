import { getInternalConfig } from '../../utils/getInternalConfig';
import { findEntrypoints } from '../../utils/findEntrypoints';
import { generateTypesDir } from '../../utils/generateTypesDir';
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
