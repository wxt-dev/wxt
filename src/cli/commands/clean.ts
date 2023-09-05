import { defineCommand } from '../utils/defineCommand';
import * as wxt from '../..';

export const clean = defineCommand<
  [
    root: string | undefined,
    flags: {
      debug?: boolean;
    },
  ]
>(async (root) => {
  const cwd = root ?? process.cwd();
  await wxt.clean(cwd);
});
