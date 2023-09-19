import * as wxt from '../..';
import { defineCommand } from '../utils/defineCommand';

export const build = defineCommand<
  [
    root: string | undefined,
    flags: {
      mode?: string;
      config?: string;
      browser?: wxt.TargetBrowser;
      mv3?: boolean;
      mv2?: boolean;
      debug?: boolean;
    },
  ]
>(async (root, flags) => {
  const cliConfig: wxt.InlineConfig = {
    root,
    mode: flags.mode,
    browser: flags.browser,
    manifestVersion: flags.mv3 ? 3 : flags.mv2 ? 2 : undefined,
    configFile: flags.config,
    debug: flags.debug,
  };

  await wxt.build(cliConfig);
});
