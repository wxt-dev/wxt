import { describe, it, expect } from 'vitest';
import { getPackageJson } from '../package';
import { setFakeWxt } from '../testing/fake-objects';
import { mock } from 'vitest-mock-extended';
import { Logger } from '~/types';
import { resolve } from 'node:path';

describe('Package JSON Utils', () => {
  describe('getPackageJson', () => {
    it('should return the package.json inside <root>/package.json', async () => {
      const root = resolve(__dirname, '../../../../'); // WXT project directory
      setFakeWxt({
        config: { root },
      });

      const actual = await getPackageJson();

      expect(actual).toMatchObject({
        name: 'wxt',
      });
    });

    it("should return an empty object when <root>/package.json doesn't exist", async () => {
      const root = '/some/path/that/does/not/exist';
      const logger = mock<Logger>();
      setFakeWxt({
        config: { root, logger },
        logger,
      });

      const actual = await getPackageJson();

      expect(actual).toEqual({});
    });
  });
});
