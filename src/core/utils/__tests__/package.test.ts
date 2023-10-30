import { describe, it, expect } from 'vitest';
import { getPackageJson } from '../package';
import { fakeInternalConfig } from '../testing/fake-objects';
import { mock } from 'vitest-mock-extended';
import { Logger } from '~/types';

describe('Package JSON Utils', () => {
  describe('getPackageJson', () => {
    it('should return the package.json inside <root>/package.json', async () => {
      const root = process.cwd(); // WXT project directory
      const actual = await getPackageJson(fakeInternalConfig({ root }));

      expect(actual).toMatchObject({
        name: 'wxt',
      });
    });

    it("should return an empty object when <root>/package.json doesn't exist", async () => {
      const root = '/some/path/that/does/not/exist';
      const logger = mock<Logger>();
      const actual = await getPackageJson(fakeInternalConfig({ root, logger }));

      expect(actual).toEqual({});
    });
  });
});
