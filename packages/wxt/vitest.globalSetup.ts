import { exists, rm } from 'fs-extra';
import spawn from 'nano-spawn';
import { rename } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';

let setupHappened = false;

export async function setup() {
  if (setupHappened) {
    throw new Error('setup called twice');
  }

  setupHappened = true;

  // @ts-expect-error
  globalThis.__ENTRYPOINT__ = 'test';

  const e2eDistPath = './e2e/dist/';
  if (await exists(e2eDistPath)) {
    await rm(e2eDistPath, { recursive: true, force: true });
  }

  // Pack WXT for projects to use
  await mkdir('e2e/dist', { recursive: true });
  await spawn('bun', ['pm', 'pack', '--filename', 'wxt.tgz']);
  await rename('../../wxt.tgz', 'e2e/dist/wxt.tgz');
}
