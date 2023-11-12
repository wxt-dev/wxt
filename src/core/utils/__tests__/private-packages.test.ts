import { describe, it, expect, vi } from 'vitest';
import { getPrivatePackages } from '../private-packages';
import {
  getPackageManager,
  PackageInfo,
  WxtPackageManager,
} from '../package-manager';
import { mock } from 'vitest-mock-extended';
import { loadConfig } from 'c12';
import { fakeInternalConfig } from '../testing/fake-objects';

vi.mock('../package-manager');
const getPackageManagerMock = vi.mocked(getPackageManager);

vi.mock('c12');
const loadConfigMock = vi.mocked(loadConfig);

describe('Private Package Utils', () => {
  describe('getPrivatePackages', () => {
    it('should return private packages for a project', async () => {
      const pm = mock<WxtPackageManager>();
      getPackageManagerMock.mockResolvedValue(pm);
      const dependencies: PackageInfo[] = [
        {
          name: 'wxt',
          version: '0.9.0',
          url: 'https://registry.npmjs.org/wxt/-/wxt-0.9.0.tgz',
        },
        {
          name: 'vite',
          version: '4.5.0',
          url: 'https://registry.npmjs.org/vite/-/vite-4.5.0.tgz',
        },
        {
          name: '@anime-skip/ui',
          version: '3.1.3',
          url: 'https://npm.pkg.github.com/@anime-skip/ui/-/@anime-skip/ui-3.1.3.tgz',
        },
        {
          name: '@webext-core/storage',
          version: '1.2.0',
          url: 'https://registry.npmjs.org/@webext-core/storage/-/@webext-core/storage-1.2.0.tgz',
        },
      ];
      const token = 'abc123';
      const npmrc = {
        '@anime-skip:registry': 'https://npm.pkg.github.com',
        // "//npm.pkg.github.com/:_authToken" unflattened to match c12's behavior
        '//npm': {
          pkg: {
            github: {
              'com/:_authToken': token,
            },
          },
        },
      };

      const expected = [
        {
          name: '@anime-skip/ui',
          version: '3.1.3',
          url: 'https://npm.pkg.github.com/@anime-skip/ui/-/@anime-skip/ui-3.1.3.tgz',
          token,
        },
      ];

      pm.getAllDependencies.mockResolvedValue(dependencies);
      loadConfigMock.mockResolvedValue({ config: npmrc });

      const result = await getPrivatePackages(fakeInternalConfig());

      expect(result).toEqual(expected);
    });
  });
});
