// PNPM can't resolve this package when put in wxt.config.ts, so we're
// importing and exporting it from a local module instead. Not sure why it
// didn't work, but this works so we'll just go with it.

import devtools from '@wxt-dev/devtools';

export default devtools;
