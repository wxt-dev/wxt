import { access, rm } from 'node:fs/promises';

let setupHappened = false;

export async function setup() {
  if (setupHappened) {
    throw new Error('setup called twice');
  }

  setupHappened = true;

  globalThis.__ENTRYPOINT__ = 'test';

  const e2eDistPath = './e2e/dist/';
  try {
    await access(e2eDistPath);
    await rm(e2eDistPath, { recursive: true, force: true });
  } catch {
    // Directory doesn't exist, nothing to clean up
  }
}
