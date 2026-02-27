import { Dependency } from '../../types';
import { WxtPackageManagerImpl } from './types';
import path from 'node:path';
import { ensureDir } from 'fs-extra';
import spawn from 'nano-spawn';

export const npm: WxtPackageManagerImpl = {
  overridesKey: 'overrides',
  async downloadDependency(id, downloadDir, options) {
    await ensureDir(downloadDir);
    const normalizedId = normalizeId(id, options?.cwd);
    const res = await spawn('npm', ['pack', normalizedId, '--json'], {
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

/** Normalizes `file:` or `link:` package ids to point to an absolute path so they can be resolved from downloadDir. */
function normalizeId(id: string, cwd?: string) {
  // this regex matches file: and link: dependencies with optional alias
  const match = id.match(/^(@?[^@]+)(?:@@?[^@]+)?@(?:file|link):(.+)$/);

  if (!match) {
    return id;
  }

  const [_, dependency, relativePath] = match;

  return `${dependency}@file:${path.resolve(cwd ?? '', relativePath)}`;
}
