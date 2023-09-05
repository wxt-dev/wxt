import { defineCommand } from '../utils/defineCommand';
import * as wxt from '../..';

export const clean = defineCommand<
  [
    root: string | undefined,
    flags: {
      debug?: boolean;
    },
  ]
>(wxt.clean);
