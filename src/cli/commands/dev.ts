import * as exvite from '../..';

export async function dev(root: any, { mode, config }: any) {
  await exvite.createServer({
    mode,
    root,
    configFile: config,
  });
}
