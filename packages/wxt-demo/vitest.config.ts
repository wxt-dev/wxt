import { defineProject } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';

export default defineProject({
  test: {
    mockReset: true,
    restoreMocks: true,
    testTimeout: 60_000,
  },
  plugins: [WxtVitest()],
});
