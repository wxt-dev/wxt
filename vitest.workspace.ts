import { defineWorkspace } from 'vitest/config';
import fs from 'fs-extra';

await fs.rm('e2e/project', { recursive: true, force: true });

export default defineWorkspace([
  {
    test: {
      name: 'unit',
      dir: 'src',
      mockReset: true,
      restoreMocks: true,
    },
  },
  {
    test: {
      name: 'e2e',
      dir: 'e2e',
      singleThread: true,
    },
  },
]);
