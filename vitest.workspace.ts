import { defineWorkspace } from 'vitest/config';
import fs from 'fs-extra';
import pc from 'picocolors';

const seed = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
console.info('Test seed: ' + pc.cyan(seed));

await fs.rm('e2e/project', { recursive: true, force: true });

export default defineWorkspace([
  {
    test: {
      name: 'unit',
      dir: 'src',
      mockReset: true,
      restoreMocks: true,
    },
    define: {
      __TEST_SEED__: JSON.stringify(seed),
    },
  },
  {
    test: {
      name: 'e2e',
      dir: 'e2e',
      singleThread: true,
    },
    define: {
      __TEST_SEED__: JSON.stringify(seed),
    },
  },
]);
