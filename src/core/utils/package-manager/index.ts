import { PackageManager, PackageManagerName, detectPackageManager } from 'nypm';
import { WxtPackageManager } from './wxt-package-manager';
import { createBunWxtPackageManager } from './bun';
import { createNpmWxtPackageManager } from './npm';
import { createPnpmWxtPackageManager } from './pnpm';
import { createYarnWxtPackageManager } from './yarn';
import { wxt } from '~/core/wxt';

export * from './wxt-package-manager';

export async function getPackageManager(): Promise<WxtPackageManager> {
  const pm = await detectPackageManager(wxt.config.root, {
    includeParentDirs: true,
  });
  if (pm == null) throw Error('Could not identify package manager');

  return {
    ...pm,
    ...wxtPackageManagers[pm.name](),
  };
}

const wxtPackageManagers: Record<
  PackageManagerName,
  () => Omit<WxtPackageManager, keyof PackageManager>
> = {
  bun: createBunWxtPackageManager,
  npm: createNpmWxtPackageManager,
  pnpm: createPnpmWxtPackageManager,
  yarn: createYarnWxtPackageManager,
};
