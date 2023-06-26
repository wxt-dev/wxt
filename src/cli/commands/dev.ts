import * as wxt from '../..';
import { defineCommand } from '../utils/defineCommand';

export const dev = defineCommand<
  [
    root: string | undefined,
    flags: {
      mode?: string;
      config?: string;
      browser?: wxt.TargetBrowser;
      mv3?: boolean;
      mv2?: boolean;
    },
  ]
>(async (root, flags) => {
  const mode = flags.mode ?? 'development';
  const cliConfig: wxt.InlineConfig = {
    root,
    mode,
    browser: flags.browser,
    manifestVersion: flags.mv3 ? 3 : flags.mv2 ? 2 : undefined,
    configFile: flags.config,
  };

  const server = await wxt.createServer(cliConfig);
  await server.listen(server.port);

  return true;
});
