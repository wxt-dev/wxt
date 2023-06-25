import * as wxt from '../..';
import { getInternalConfig } from '../../utils/getInternalConfig';
import { defineCommand } from '../utils/defineCommand';

export const build = defineCommand(
  async (root: any, { mode, config: configFile }: any) => {
    const cliConfig: wxt.InlineConfig = { root, mode, configFile };
    const config = await getInternalConfig(cliConfig, mode);

    await wxt.build(config);
  },
);
