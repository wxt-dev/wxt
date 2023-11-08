import { PackageManager, PackageManagerName, detectPackageManager } from 'nypm';
import { InternalConfig } from '~/types';
import { WxtPackageManager } from './wxt-package-manager';
import { createBunWxtPackageManager } from './bun';
import { createNpmWxtPackageManager } from './npm';
import { createPnpmWxtPackageManager } from './pnpm';
import { createYarnWxtPackageManager } from './yarn';

export * from './wxt-package-manager';

export async function getPackageManager(
  config: InternalConfig,
): Promise<WxtPackageManager> {
  const pm = await detectPackageManager(config.root, {
    includeParentDirs: true,
  });
  if (pm == null) throw Error('Could not identify package manager');

  return {
    ...pm,
    ...wxtPackageManagers[pm.name](config),
  };
}

const wxtPackageManagers: Record<
  PackageManagerName,
  (config: InternalConfig) => Omit<WxtPackageManager, keyof PackageManager>
> = {
  bun: createBunWxtPackageManager,
  npm: createNpmWxtPackageManager,
  pnpm: createPnpmWxtPackageManager,
  yarn: createYarnWxtPackageManager,
};
