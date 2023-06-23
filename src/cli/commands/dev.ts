import * as exvite from '../..';
import { defineCommand } from '../utils/defineCommand';

export const dev = defineCommand(
  async (root: any, { mode, config: configFile }: any) => {
    const cliConfig: exvite.InlineConfig = {
      mode,
      root,
      configFile,
    };
    const server = await exvite.createServer(cliConfig);

    await server.listen(server.port);
    server.logger.success(`Started dev server @ ${server.origin}`);
    return true;
  },
);
