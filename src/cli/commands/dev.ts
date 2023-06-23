import * as exvite from '../..';
import { defineCommand } from '../utils/defineCommand';

export const dev = defineCommand(
  async (root: any, { mode, config: configFile }: any) => {
    const cliConfig: exvite.InlineConfig = {
      mode,
      root,
      configFile,
    };
    await exvite.createServer(cliConfig);
  },
);
