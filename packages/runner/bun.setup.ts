import { afterEach, mock, vi } from 'bun:test';

afterEach(() => {
  mock.restore();
  vi.resetAllMocks();
});
