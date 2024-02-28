import { WxtPackageManager } from './wxt-package-manager';
import { PackageManager } from 'nypm';
import {
  NpmListDependency,
  NpmListProject,
  flattenNpmDependencyMap,
} from './npm';
import { execa } from 'execa';
import { wxt } from '~/core/wxt';

export function createPnpmWxtPackageManager(options?: {
  pnpmFlags?: string[];
}): Omit<WxtPackageManager, keyof PackageManager> {
  return {
    async getAllDependencies() {
      const { stdout: json } = await execa(
        'pnpm',
        [
          ...(options?.pnpmFlags ?? []),
          'list',
          '--json',
          '--depth',
          'Infinity',
        ],
        { cwd: wxt.config.root },
      );
      const project: PnpmListProject[] = JSON.parse(json);
      return [
        project[0]?.dependencies
          ? flattenNpmDependencyMap(project[0].dependencies)
          : [],
        project[0]?.devDependencies
          ? flattenNpmDependencyMap(project[0].devDependencies)
          : [],
      ].flat();
    },

    addResolutions(packageJson, entries) {
      packageJson.pnpm ??= {};
      packageJson.pnpm.overrides ??= {};
      entries.forEach(({ name, value }) => {
        packageJson.pnpm.overrides[name] = value;
      });
    },
  };
}

interface PnpmListProject extends NpmListProject {
  devDependencies: Record<string, NpmListDependency>;
}
