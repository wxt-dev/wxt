import { afterEach, mock, vi } from 'bun:test';
import { access, rm } from 'node:fs/promises';

import '@webext-core/fake-browser/auto';

globalThis.__ENTRYPOINT__ = 'test';

const e2eDistPath = './e2e/dist/';
try {
  await access(e2eDistPath);
  await rm(e2eDistPath, { recursive: true, force: true });
} catch {
  // Directory doesn't exist, nothing to clean up
}

// Equivalent of Vitest's `mockReset` and `restoreMocks` options
afterEach(() => {
  mock.restore();
  vi.resetAllMocks();
});
