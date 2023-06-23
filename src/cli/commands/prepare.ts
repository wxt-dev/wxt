import { getInternalConfig } from '../../utils/getInternalConfig';
import { findEntrypoints } from '../../utils/findEntrypoints';
import { generateTypesDir } from '../../utils/generateTypesDir';
import { defineCommand } from '../utils/defineCommand';
import * as exvite from '../..';

export const prepare = defineCommand(
  async (root: any, { mode, config: configFile }: any) => {
    const cliConfig: exvite.InlineConfig = { root, mode, configFile };
    const config = await getInternalConfig(cliConfig, 'build');

    config.logger.info('Generating types...');

    const entrypoints = await findEntrypoints(config);
    await generateTypesDir(entrypoints, config);
  },
);
