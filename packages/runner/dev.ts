//
// USAGE:
//   bun run dev
//   bun run dev firefox-nightly
//   bun run dev <target>
//

import { run } from './src';

// Uncomment to enable debug logs
process.env.DEBUG = '@wxt-dev/runner';

await run({
  extensionDir: 'demo-extension',
  target: process.argv[2],
});
