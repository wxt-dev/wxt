import { defineProject } from 'vitest/config';
import { WxtVitest } from 'wxt/testing';

export default defineProject({
  test: {
    mockReset: true,
    restoreMocks: true,
  },
  plugins: [
    // @ts-expect-error: Vite version mismatch
    WxtVitest(),
  ],
});
