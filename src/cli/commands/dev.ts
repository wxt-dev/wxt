import * as wxt from '../..';
import { defineCommand } from '../utils/defineCommand';

export const dev = defineCommand(
  async (root: any, { mode, config: configFile }: any) => {
    const cliConfig: wxt.InlineConfig = {
      mode,
      root,
      configFile,
    };
    const server = await wxt.createServer(cliConfig);

    await server.listen(server.port);
    server.logger.success(`Started dev server @ ${server.origin}`);
    return true;
  },
);
