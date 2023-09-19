import * as wxt from '../..';
import { buildInternal } from '../../core/build';
import { getInternalConfig } from '../../core/utils/getInternalConfig';
import { zipExtension } from '../../core/zip';
import { defineCommand } from '../utils/defineCommand';

export const zip = defineCommand<
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

  const config = await getInternalConfig(cliConfig, 'build');
  const output = await buildInternal(config);
  await zipExtension(config, output);
});
