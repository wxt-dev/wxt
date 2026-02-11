import spawn from 'nano-spawn';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { pnpm } from '../pnpm';

process.env.WXT_PNPM_IGNORE_WORKSPACE = 'true';

describe('PNPM Package Management Utils', () => {
  describe('listDependencies', () => {
    const cwd = path.resolve(__dirname, 'fixtures/simple-pnpm-project');
    beforeAll(async () => {
      // PNPM needs the modules installed, or 'pnpm ls' will return a blank list.
      await spawn('pnpm', ['install'], { cwd, stdio: 'inherit' });
    });

    it('should list direct dependencies', async () => {
      const actual = await pnpm.listDependencies({ cwd });
      expect(actual).toEqual([
        { name: 'flatten', version: '1.0.3' },
        { name: 'mime-types', version: '2.1.35' },
      ]);
    });

    it('should list all dependencies', async () => {
      const actual = await pnpm.listDependencies({ cwd, all: true });
      expect(actual).toEqual([
        { name: 'flatten', version: '1.0.3' },
        { name: 'mime-types', version: '2.1.35' },
        { name: 'mime-db', version: '1.52.0' },
      ]);
    });
  });
});
