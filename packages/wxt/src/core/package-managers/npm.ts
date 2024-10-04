import { Dependency } from '../../types';
import { WxtPackageManagerImpl } from './types';
import path from 'node:path';
import { ensureDir } from 'fs-extra';

export const npm: WxtPackageManagerImpl = {
  overridesKey: 'overrides',
  async downloadDependency(id, downloadDir) {
    await ensureDir(downloadDir);
    const { default: spawn } = await import('nano-spawn');
    const res = await spawn('npm', ['pack', id, '--json'], {
      cwd: downloadDir,
    });
    const packed: PackedDependency[] = JSON.parse(res.stdout);
    return path.resolve(downloadDir, packed[0].filename);
  },
  async listDependencies(options) {
    const args = ['ls', '--json'];
    if (options?.all) {
      args.push('--depth', 'Infinity');
    }
    const { default: spawn } = await import('nano-spawn');
    const res = await spawn('npm', args, { cwd: options?.cwd });
    const project: NpmListProject = JSON.parse(res.stdout);

    return flattenNpmListOutput([project]);
  },
};

export function flattenNpmListOutput(projects: NpmListProject[]): Dependency[] {
  const queue: Record<string, NpmListDependency>[] = projects.flatMap(
    (project) => {
      const acc: Record<string, NpmListDependency>[] = [];
      if (project.dependencies) acc.push(project.dependencies);
      if (project.devDependencies) acc.push(project.devDependencies);
      return acc;
    },
  );
  const dependencies: Dependency[] = [];
  while (queue.length > 0) {
    Object.entries(queue.pop()!).forEach(([name, meta]) => {
      dependencies.push({
        name,
        version: meta.version,
      });
      if (meta.dependencies) queue.push(meta.dependencies);
      if (meta.devDependencies) queue.push(meta.devDependencies);
    });
  }
  return dedupeDependencies(dependencies);
}

export function dedupeDependencies(dependencies: Dependency[]): Dependency[] {
  const hashes = new Set<string>();
  return dependencies.filter((dep) => {
    const hash = `${dep.name}@${dep.version}`;
    if (hashes.has(hash)) {
      return false;
    } else {
      hashes.add(hash);
      return true;
    }
  });
}

export interface NpmListProject {
  name: string;
  dependencies?: Record<string, NpmListDependency>;
  devDependencies?: Record<string, NpmListDependency>;
}

export interface NpmListDependency {
  version: string;
  resolved?: string;
  overridden?: boolean;
  dependencies?: Record<string, NpmListDependency>;
  devDependencies?: Record<string, NpmListDependency>;
}

interface PackedDependency {
  id: string;
  name: string;
  version: string;
  filename: string;
}
