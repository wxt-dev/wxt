import {
  detectPackageManager,
  addDependency,
  addDevDependency,
  ensureDependencyInstalled,
  installDependencies,
  removeDependency,
  PackageManager,
  PackageManagerName,
} from 'nypm';
import { WxtPackageManager } from '~/types';
import { bun } from './bun';
import { WxtPackageManagerImpl } from './types';
import { yarn } from './yarn';
import { pnpm } from './pnpm';
import { npm } from './npm';

export async function createWxtPackageManager(
  root: string,
): Promise<WxtPackageManager> {
  const pm = await detectPackageManager(root, {
    includeParentDirs: true,
  });

  // Use requirePm to prevent throwing errors before the package manager utils are used.
  const requirePm = <T>(cb: (pm: PackageManager) => T) => {
    if (pm == null) throw Error('Could not detect package manager');
    return cb(pm);
  };

  return {
    get name() {
      return requirePm((pm) => pm.name);
    },
    get command() {
      return requirePm((pm) => pm.command);
    },
    get version() {
      return requirePm((pm) => pm.version);
    },
    get majorVersion() {
      return requirePm((pm) => pm.majorVersion);
    },
    get lockFile() {
      return requirePm((pm) => pm.lockFile);
    },
    get files() {
      return requirePm((pm) => pm.files);
    },
    addDependency,
    addDevDependency,
    ensureDependencyInstalled,
    installDependencies,
    removeDependency,
    get overridesKey() {
      return requirePm((pm) => packageManagers[pm.name].overridesKey);
    },
    downloadDependency(...args) {
      return requirePm((pm) =>
        packageManagers[pm.name].downloadDependency(...args),
      );
    },
    listDependencies(...args) {
      return requirePm((pm) =>
        packageManagers[pm.name].listDependencies(...args),
      );
    },
  };
}

const packageManagers: Record<PackageManagerName, WxtPackageManagerImpl> = {
  npm,
  pnpm,
  bun,
  yarn,
};
