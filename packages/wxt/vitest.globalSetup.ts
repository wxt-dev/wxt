import { rm } from 'fs/promises';
import { existsSync } from 'fs';
import consola from 'consola';

let teardownHappened = false;

export async function setup() {
  // @ts-expect-error
  globalThis.__ENTRYPOINT__ = 'test';
}

export async function teardown() {
  if (teardownHappened) {
    throw new Error('teardown called twice');
  }
  teardownHappened = true;

  const e2eDistPath = './e2e/dist/';
  if (existsSync(e2eDistPath)) {
    try {
      await rm(e2eDistPath, { recursive: true, force: true });
      consola.info(`cleaned up ${e2eDistPath}`);
    } catch (error) {
      consola.error(error);
    }
  }
}
