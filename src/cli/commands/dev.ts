import * as exvite from '../..';
import { defineCommand } from '../utils/defineCommand';

export const dev = defineCommand(async (root: any, { mode, config }: any) => {
  await exvite.createServer({
    mode,
    root,
    configFile: config,
  });
});
