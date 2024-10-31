import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    mockReset: true,
    restoreMocks: true,
  },
});
