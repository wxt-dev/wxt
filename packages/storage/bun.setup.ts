import { afterEach, mock, vi } from 'bun:test';

import { fakeBrowser } from '@webext-core/fake-browser';

Object.assign(globalThis, { chrome: fakeBrowser });

afterEach(() => {
  mock.restore();
  vi.resetAllMocks();
});
