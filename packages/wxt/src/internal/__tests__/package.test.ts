import { describe, it, expect } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { WXT_PACKAGE_DIR } from '../../../e2e/utils';
import { setFakeWxt } from '../../internal-utils/testing/fake-objects';
import { Logger } from '../../types';
import { getPackageJson } from '../package';

describe('Package JSON Utils', () => {
  describe('getPackageJson', () => {
    it('should return the package.json inside <root>/package.json', async () => {
      setFakeWxt({
        config: { root: WXT_PACKAGE_DIR },
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
