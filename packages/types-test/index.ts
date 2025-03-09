import { copy } from 'fs-extra';
import { readdir, readFile, writeFile } from 'fs/promises';
import { createRequire } from 'module';
import { dirname, join } from 'path';
const require = createRequire(import.meta.url);
const modulePath = dirname(require.resolve('@types/chrome/package.json'));

const outDir = join(import.meta.dirname, 'lib');

const indexDTs = await readFile(join(modulePath, 'index.d.ts'), 'utf8');
const chromeCast = await readFile(
  join(modulePath, 'chrome-cast/index.d.ts'),
  'utf8',
);

await copy(join(modulePath, 'chrome-cast'), join(outDir, 'chrome-cast'));
await copy(join(modulePath, 'har-format'), join(outDir, 'har-format'));

let rewritten = indexDTs
  .replaceAll(/\bchrome\./g, 'browser.')
  .replaceAll(/\bchrome\b/g, 'browser');

await writeFile(join(outDir, 'index.d.ts'), rewritten);
await writeFile(
  join(outDir, 'chrome-cast/index.d.ts'),
  chromeCast
    .replaceAll(/\bchrome\./g, 'browser.')
    .replaceAll(/\bchrome\b/g, 'browser'),
);
/*
wxtBrowser.runtime.;
browser.runtime.MessageSender;
chrome.runtime.MessageSender; */
/*
const test: browser.runtime.MessageSender;
 */
