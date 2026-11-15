import { afterEach, mock, vi } from 'bun:test';

import '@webext-core/fake-browser/auto';

afterEach(() => {
  mock.restore();
  vi.resetAllMocks();
});
