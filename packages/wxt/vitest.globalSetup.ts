import { exists, rm } from 'fs-extra';

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
}
