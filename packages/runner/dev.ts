//
// USAGE:
//   bun run dev
//   bun run dev firefox-nightly
//   bun run dev <target>
//

import { run } from './src';

await run({
  extensionDir: 'demo-extension-1',
  chromiumAdditionalExtensionDirs: ['demo-extension-2'],
  // firefoxAdditionalExtensionDirs: ['demo-extension-2'],
  target: process.argv[2],
});
