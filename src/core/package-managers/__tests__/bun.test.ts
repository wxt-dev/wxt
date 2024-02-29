import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { bun } from '../bun';

const cwd = path.resolve(__dirname, 'fixtures/bun-project');

describe('Bun Package Management Utils', () => {
  describe('listDependencies', () => {
    it('should list direct dependencies', async () => {
      const actual = await bun.listDependencies({ cwd });
      expect(actual).toEqual([
        { name: 'flatten', version: '1.0.3' },
        { name: 'mime-types', version: '2.1.35' },
      ]);
    });

    it('should list all dependencies', async () => {
      const actual = await bun.listDependencies({ cwd, all: true });
      expect(actual).toEqual([
        { name: 'flatten', version: '1.0.3' },
        { name: 'mime-db', version: '1.52.0' },
        { name: 'mime-types', version: '2.1.35' },
      ]);
    });
  });
});
