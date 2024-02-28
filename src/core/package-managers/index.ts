import {
  detectPackageManager,
  addDependency,
  addDevDependency,
  ensureDependencyInstalled,
  installDependencies,
  removeDependency,
  PackageManager,
} from 'nypm';
import { WxtPackageManager } from '~/types';

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
  };
}
