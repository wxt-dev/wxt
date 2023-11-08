import { InternalConfig } from '~/types';
import { WxtPackageManager } from './wxt-package-manager';
import { PackageManager } from 'nypm';

export function createBunWxtPackageManager(
  config: InternalConfig,
): Omit<WxtPackageManager, keyof PackageManager> {
  throw Error(
    'WXT does not support bun yet, follow https://github.com/wxt-dev/wxt/issues/222 to track progress',
  );
}
