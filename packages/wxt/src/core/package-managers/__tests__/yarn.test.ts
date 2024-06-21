import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { yarn } from '../yarn';

describe('Yarn Package Management Utils', () => {
  describe('listDependencies', () => {
    const cwd = path.resolve(__dirname, 'fixtures/simple-yarn-project');

    it('should list direct dependencies', async () => {
      const actual = await yarn.listDependencies({ cwd });
      expect(actual).toEqual([
        { name: 'mime-db', version: '1.52.0' },
        { name: 'flatten', version: '1.0.3' },
        { name: 'mime-types', version: '2.1.35' },
      ]);
    });

    it('should list all dependencies', async () => {
      const actual = await yarn.listDependencies({ cwd, all: true });
      expect(actual).toEqual([
        { name: 'mime-db', version: '1.52.0' },
        { name: 'flatten', version: '1.0.3' },
        { name: 'mime-types', version: '2.1.35' },
      ]);
    });
  });
});
