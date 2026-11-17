import { defineProject } from 'vite-plus/test/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineProject({
  test: {
    // Faster worker reuse; suites already reset mocks/DOM per file.
    // https://vitest.dev/guide/improving-performance#test-isolation
    isolate: false,
    mockReset: true,
    restoreMocks: true,
  },
  // Explicit root so monorepo `vp test` (cwd = repo root) still resolves this
  // package's wxt.config.ts and auto-imports.
  plugins: [WxtVitest({ root: import.meta.dirname })],
});
