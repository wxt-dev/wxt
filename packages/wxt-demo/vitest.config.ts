import { defineProject } from 'vite-plus/test/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineProject({
  test: {
    mockReset: true,
    restoreMocks: true,
  },
  // Explicit root so monorepo `vp test` (cwd = repo root) still resolves this
  // package's wxt.config.ts and auto-imports.
  plugins: [WxtVitest({ root: import.meta.dirname })],
});
