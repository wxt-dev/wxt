import * as exvite from '../..';
import { defineCommand } from '../utils/defineCommand';

export const build = defineCommand(async (root: any, { mode, config }: any) => {
  await exvite.build({
    mode,
    root,
    configFile: config,
  });
});
