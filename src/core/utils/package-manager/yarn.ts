import { InternalConfig } from '~/types';
import { WxtPackageManager } from './wxt-package-manager';
import { PackageManager } from 'nypm';

export function createYarnWxtPackageManager(
  config: InternalConfig,
): Omit<WxtPackageManager, keyof PackageManager> {
  return {
    getAllDependencies() {
      throw Error(
        'Yarn does not return tarball URLs, getAllDependencies cannot be implemented',
      );
    },
    addResolutions(packageJson, entries) {
      packageJson.resolutions ??= {};
      entries.forEach(({ name, value }) => {
        packageJson.resolutions[name] = value;
      });
    },
  };
}
