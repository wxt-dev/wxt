import fs from 'fs-extra';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resolveVirtualModules } from '../resolveVirtualModules';
import { fakeResolvedConfig } from '../../../../utils/testing/fake-objects';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => fs.remove(dir)));
});

describe('resolveVirtualModules', () => {
  it.each([
    `import definition from 'virtual:user-background-entrypoint';`,
    `import definition from "virtual:user-background-entrypoint";`,
  ])(
    'should escape input paths when template contains %s',
    async (template) => {
      const wxtModuleDir = await fs.mkdtemp(join(tmpdir(), 'wxt-test-'));
      tempDirs.push(wxtModuleDir);

      await fs.outputFile(
        join(wxtModuleDir, 'dist/virtual/background-entrypoint.mjs'),
        template,
      );

      const plugin = resolveVirtualModules(
        fakeResolvedConfig({ wxtModuleDir }),
      ).find(
        (plugin) => plugin.name === 'wxt:resolve-virtual-background-entrypoint',
      );

      expect(plugin).toBeDefined();

      const inputPath = `/tmp/foo'bar/background.ts`;
      const code = await plugin!.load!(
        '\0virtual:wxt-background-entrypoint?' + inputPath,
      );

      expect(code).toBe(`import definition from ${JSON.stringify(inputPath)};`);
    },
  );
});
