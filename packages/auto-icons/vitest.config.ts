import { defineProject } from 'vite-plus/test/config';

export default defineProject({
  test: {
    // Faster worker reuse; suites already reset mocks/DOM per file.
    // https://vitest.dev/guide/improving-performance#test-isolation
    isolate: false,
    mockReset: true,
    restoreMocks: true,
  },
});
