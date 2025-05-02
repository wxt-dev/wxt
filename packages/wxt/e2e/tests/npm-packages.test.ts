import { test, expect } from 'vitest';
import { bun } from '../../src/core/package-managers/bun';

// Tests to ensure the total size of the WXT module is as small as possible
// https://pkg-size.dev/wxt

test('Only one version of esbuild should be installed (each version is ~20mb of node_modules)', async () => {
  // TODO
  const deps = await bun.listDependencies({ all: true });
  console.log(deps.filter((dep) => dep.name.startsWith('e')));
  const esbuildVersions = new Set<string>();
  deps.forEach((dep) => {
    if (dep.name === 'esbuild') esbuildVersions.add(dep.version);
  });
  console.log(esbuildVersions);

  expect([...esbuildVersions]).toHaveLength(1);
});
