import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveVirtualModules } from '../resolveVirtualModules';
import { fakeResolvedConfig } from '../../../../utils/testing/fake-objects';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe('resolveVirtualModules', () => {
  it.each([
    `import definition from 'virtual:user-background-entrypoint';`,
    `import definition from "virtual:user-background-entrypoint";`,
  ])(
    'should escape input paths with apostrophes when encountering: %s',
    async (template) => {
      const wxtModuleDir = await mkdtemp(join(tmpdir(), 'wxt-test-'));
      tempDirs.push(wxtModuleDir);

      const filePath = join(
        wxtModuleDir,
        'dist/virtual/background-entrypoint.mjs',
      );
      await mkdir(join(wxtModuleDir, 'dist/virtual'), { recursive: true });
      await writeFile(filePath, template);

      const plugin = resolveVirtualModules(
        fakeResolvedConfig({ wxtModuleDir }),
      ).find(
        (plugin) => plugin.name === 'wxt:resolve-virtual-background-entrypoint',
      );

      expect(plugin).toBeDefined();

      const inputPath = `/tmp/foo'bar/background.ts`;
      const code = await plugin!.load!.handler!(
        '\0virtual:wxt-background-entrypoint?' + inputPath,
      );

      expect(code).toBe(
        `import definition from file:///tmp/foo'bar/background.ts;`,
      );
    },
  );

  it.each([
    `import definition from 'virtual:user-background-entrypoint';`,
    `import definition from "virtual:user-background-entrypoint";`,
  ])(
    'should escape input paths with double quotes when encountering: %s',
    async (template) => {
      const wxtModuleDir = await mkdtemp(join(tmpdir(), 'wxt-test-'));
      tempDirs.push(wxtModuleDir);

      const filePath = join(
        wxtModuleDir,
        'dist/virtual/background-entrypoint.mjs',
      );
      await mkdir(join(wxtModuleDir, 'dist/virtual'), { recursive: true });
      await writeFile(filePath, template);

      const plugin = resolveVirtualModules(
        fakeResolvedConfig({ wxtModuleDir }),
      ).find(
        (plugin) => plugin.name === 'wxt:resolve-virtual-background-entrypoint',
      );

      expect(plugin).toBeDefined();

      const inputPath = `/tmp/foo"bar/background.ts`;
      const code = await plugin!.load!.handler!(
        '\0virtual:wxt-background-entrypoint?' + inputPath,
      );

      expect(code).toBe(
        `import definition from file:///tmp/foo%22bar/background.ts;`,
      );
    },
  );
});
