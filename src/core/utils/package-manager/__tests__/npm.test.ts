import { beforeAll, describe, expect, it } from 'vitest';
import { createNpmWxtPackageManager } from '../npm';
import { fakeInternalConfig } from '../../testing/fake-objects';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(__dirname, 'fixtures/npm-project');

describe('NPM Utils', () => {
  beforeAll(async () => {
    await execa('npm', ['install'], { cwd: projectDir });
  });

  describe('getAllPackages', () => {
    it('should return all the packages in the directory', async () => {
      const config = fakeInternalConfig({ root: projectDir });
      const npm = createNpmWxtPackageManager(config);

      const res = await npm.getAllDependencies();

      expect(res.length).toBe(554);
      expect(res).toContainEqual({
        name: 'wxt',
        url: 'https://registry.npmjs.org/wxt/-/wxt-0.9.0.tgz',
        version: '0.9.0',
      });
      expect(res).toContainEqual({
        name: 'flat',
        url: 'https://registry.npmjs.org/flat/-/flat-6.0.1.tgz',
        version: '6.0.1',
      });
      expect(res).toContainEqual({
        name: 'is-number',
        url: 'https://registry.npmjs.org/is-number/-/is-number-7.0.0.tgz',
        version: '7.0.0',
      });
    });
  });
});
