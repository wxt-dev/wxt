import { test, expect } from 'vitest';
import spawn from 'nano-spawn';

// Tests to ensure the total size of the WXT module is as small as possible
// https://pkg-size.dev/wxt

test('Only one version of esbuild should be installed (each version is ~20mb of node_modules)', async () => {
  const { stdout } = await spawn('bun', ['why', 'esbuild']);

  // This text represents the wxt package being responsible for a version of esbuild?
  // If this doesn't work, we'll need to find a better way to check this.
  const count = stdout.match(/\n  [└├]─ wxt@workspace/g)?.length || 0;

  expect(count).toBe(1);
});
