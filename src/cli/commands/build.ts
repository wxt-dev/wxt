import * as exvite from '../..';
import { getInternalConfig } from '../../utils/getInternalConfig';
import { defineCommand } from '../utils/defineCommand';

export const build = defineCommand(
  async (root: any, { mode, config: configFile }: any) => {
    const cliConfig: exvite.InlineConfig = { root, mode, configFile };
    const config = await getInternalConfig(cliConfig, mode);

    await exvite.build(config);
  },
);
