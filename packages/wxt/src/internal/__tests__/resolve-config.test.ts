import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { loadConfig } from 'c12';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { pathExists } from '../../internal-utils/fs-utils';
import type { Logger } from '../../types';
import { resolveConfig, resolveWxtUserModules } from '../resolve-config';

vi.mock('../../internal-utils/fs-utils');
const pathExistsMock = vi.mocked(pathExists);

vi.mock('c12');
const loadConfigMock = vi.mocked(loadConfig);

describe('resolveConfig', () => {
  beforeEach(() => {
    loadConfigMock.mockResolvedValue({ config: {} });
    pathExistsMock.mockResolvedValue(true);
  });

  describe('logger', () => {
    it('should wrap the resolved logger with warnOnce', async () => {
      const logger = mock<Logger>();

      const config = await resolveConfig({ logger }, 'build');

      expect(config.logger.warnOnce).toBeTypeOf('function');
    });

    it('should warn when the entrypoints directory is missing', async () => {
      const logger = mock<Logger>();
      pathExistsMock.mockResolvedValue(false);

      await resolveConfig({ logger }, 'build');

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Entrypoints directory not found'),
      );
    });
  });

  describe('imports.dirs', () => {
    const logger = mock<Logger>();

    it('should default to the built-in directories', async () => {
      const config = await resolveConfig({ logger }, 'build');

      expect(config.imports.dirs).toEqual([
        'components',
        'composables',
        'hooks',
        'utils',
      ]);
    });

    it('should extend the built-in directories when dirs is set', async () => {
      const config = await resolveConfig(
        { logger, imports: { dirs: ['some-directory'] } },
        'build',
      );

      expect(config.imports.dirs).toEqual([
        'some-directory',
        'components',
        'composables',
        'hooks',
        'utils',
      ]);
    });

    it('should clear the built-in directories when scan is false', async () => {
      const config = await resolveConfig(
        { logger, imports: { scan: false } },
        'build',
      );

      expect(config.imports.dirs).toEqual([]);
    });

    it('should replace the built-in directories when scan is false and dirs is set', async () => {
      const config = await resolveConfig(
        { logger, imports: { scan: false, dirs: ['some-directory'] } },
        'build',
      );

      expect(config.imports.dirs).toEqual(['some-directory']);
    });

    it('should stay empty when imports is disabled', async () => {
      const config = await resolveConfig({ logger, imports: false }, 'build');

      expect(config.imports.dirs).toEqual([]);
    });
  });
});

describe('resolveWxtUserModules', () => {
  it('should resolve npm modules relative to the project root, not wxt', async () => {
    const baseDir = await mkdtemp(path.join(tmpdir(), 'wxt-modules-test-'));
    try {
      const createProjectWithModule = async (
        projectName: string,
        moduleName: string,
        moduleLabel: string,
      ) => {
        const root = path.join(baseDir, projectName);
        const modDir = path.join(root, 'node_modules', moduleName);
        await mkdir(modDir, { recursive: true });
        await writeFile(
          path.join(modDir, 'package.json'),
          JSON.stringify({
            name: moduleName,
            type: 'module',
            exports: { '.': { import: './index.mjs' } },
          }),
        );
        await writeFile(
          path.join(modDir, 'index.mjs'),
          `export default { name: ${JSON.stringify(moduleLabel)}, setup() {} };\n`,
        );
        return root;
      };

      const rootA = await createProjectWithModule(
        'project-a',
        'test-wxt-user-module',
        'mod-v1',
      );
      const rootB = await createProjectWithModule(
        'project-b',
        'test-wxt-user-module',
        'mod-v2',
      );

      const [modA] = await resolveWxtUserModules(
        rootA,
        path.join(rootA, 'modules'),
        ['test-wxt-user-module'],
      );
      const [modB] = await resolveWxtUserModules(
        rootB,
        path.join(rootB, 'modules'),
        ['test-wxt-user-module'],
      );

      expect(modA.name).toBe('mod-v1');
      expect(modB.name).toBe('mod-v2');
    } finally {
      await rm(baseDir, { recursive: true, force: true });
    }
  });
});
