import { describe, it, expect } from 'vitest';
import spawn from 'nano-spawn';
import { test } from 'vitest';
import {
  NpmListDependency,
  NpmListProject,
} from '../../src/core/package-managers/npm';

// Tests to ensure the total size of the WXT module is as small as possible
// https://pkg-size.dev/wxt

test('Only one version of esbuild should be installed (each version is ~10mb of node_modules)', async () => {
  const { stdout } = await spawn('pnpm', [
    'why',
    'esbuild',
    '--prod',
    '--json',
  ]);
  const projects: NpmListProject[] = JSON.parse(stdout);
  const esbuildVersions = new Set<string>();
  iterateDependencies(projects, (name, meta) => {
    if (name === 'esbuild') esbuildVersions.add(meta.version);
  });

  expect([...esbuildVersions]).toHaveLength(1);
});

function iterateDependencies(
  projects: NpmListProject[],
  cb: (name: string, meta: NpmListDependency) => void,
) {
  const recurse = (dependencies: Record<string, NpmListDependency>) => {
    Object.entries(dependencies).forEach(([name, meta]) => {
      cb(name, meta);
      if (meta.dependencies) recurse(meta.dependencies);
    });
  };
  projects.forEach((project) => {
    if (project.dependencies) recurse(project.dependencies);
  });
}
