import { InternalConfig } from '~/types';
import { WxtPackageManager } from './wxt-package-manager';
import { PackageManager } from 'nypm';

export function createBunWxtPackageManager(
  config: InternalConfig,
): Omit<WxtPackageManager, keyof PackageManager> {
  return {
    getAllDependencies() {
      throw Error('Bun: getAllDependencies not implemented');
    },

    addResolutions(packageJson, entries) {
      packageJson.overrides ??= {};
      entries.forEach(({ name, value }) => {
        packageJson.overrides[name] = value;
      });
    },
  };
}
