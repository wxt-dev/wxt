import { InternalConfig } from '~/types';
import { PackageInfo, WxtPackageManager } from './wxt-package-manager';
import { PackageManager } from 'nypm';
import { execa } from 'execa';

export function createNpmWxtPackageManager(
  config: InternalConfig,
): Omit<WxtPackageManager, keyof PackageManager> {
  return {
    async getAllDependencies() {
      const { stdout: json } = await execa(
        'npm',
        ['list', '--json', '--depth', 'Infinity'],
        { cwd: config.root },
      );
      const project: NpmListProject = JSON.parse(json);
      return flattenNpmDependencyMap(project.dependencies);
    },

    addResolutions(packageJson, entries) {
      packageJson.overrides ??= {};
      entries.forEach(({ name, value }) => {
        packageJson.overrides[name] = value;
      });
    },
  };
}

export function flattenNpmDependencyMap(
  map: Record<string, NpmListDependency> | undefined,
): PackageInfo[] {
  if (map == null) return [];

  return Object.entries(map).flatMap(([name, info]) => {
    const res: Array<PackageInfo | PackageInfo[]> = [
      {
        name: name,
        version: info.version,
        url: info.resolved,
      },
    ];
    if (info.dependencies) {
      res.push(flattenNpmDependencyMap(info.dependencies));
    }
    return res.flat();
  });
}

export interface NpmListProject {
  name: string;
  dependencies: Record<string, NpmListDependency>;
}

export interface NpmListDependency {
  version: string;
  resolved?: string;
  overridden?: boolean;
  dependencies?: Record<string, NpmListDependency>;
}
