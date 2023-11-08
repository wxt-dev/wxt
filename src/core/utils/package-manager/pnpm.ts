import { InternalConfig } from '~/types';
import { WxtPackageManager } from './wxt-package-manager';
import { PackageManager } from 'nypm';
import {
  NpmListDependency,
  NpmListProject,
  flattenNpmDependencyMap,
} from './npm';
import { execa } from 'execa';

export function createPnpmWxtPackageManager(
  config: InternalConfig,
  options?: {
    pnpmFlags?: string[];
  },
): Omit<WxtPackageManager, keyof PackageManager> {
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
        { cwd: config.root },
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
  };
}

interface PnpmListProject extends NpmListProject {
  devDependencies: Record<string, NpmListDependency>;
}
