import { pathExists, rm } from 'fs-extra';

let setupHappened = false;

export async function setup() {
  if (setupHappened) {
    throw new Error('setup called twice');
  }

  setupHappened = true;

  globalThis.__ENTRYPOINT__ = 'test';

  const E2E_DIST_PATH = './e2e/dist/';

  if (await pathExists(E2E_DIST_PATH)) {
    await rm(E2E_DIST_PATH, { recursive: true, force: true });
  }
}
