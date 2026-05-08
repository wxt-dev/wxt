import { defineProject } from 'vite-plus/test/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineProject({
  test: {
    mockReset: true,
    restoreMocks: true,
  },
  plugins: [WxtVitest()],
});
