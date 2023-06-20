import * as exvite from '..';

export async function build(root: any, { mode, config }: any) {
  await exvite.build({
    mode,
    root,
    configFile: config,
  });
}
