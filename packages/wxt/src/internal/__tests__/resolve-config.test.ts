import { afterAll, beforeEach, describe, expect, it, mock } from 'bun:test';

import { loadConfig } from 'c12';

import { pathExists } from '../../internal-utils/fs-utils';
import {
  automock,
  mock as mockOf,
  mocked,
} from '../../internal-utils/testing/mock';
import type { Logger } from '../../types';
import { resolveConfig } from '../resolve-config';

const actualFsUtils = await import('../../internal-utils/fs-utils');
mock.module('../../internal-utils/fs-utils', () => automock(actualFsUtils));
const pathExistsMock = mocked(pathExists);

const actualC12 = await import('c12');
mock.module('c12', () => automock(actualC12));
afterAll(() => {
  mock.module('../../internal-utils/fs-utils', () => actualFsUtils);
  mock.module('c12', () => actualC12);
});
const loadConfigMock = mocked(loadConfig);

describe('resolveConfig', () => {
  beforeEach(() => {
    loadConfigMock.mockResolvedValue({ config: {} });
    pathExistsMock.mockResolvedValue(true);
  });

  describe('logger', () => {
    it('should wrap the resolved logger with warnOnce', async () => {
      const logger = mockOf<Logger>();

      const config = await resolveConfig({ logger }, 'build');

      expect(config.logger.warnOnce).toBeTypeOf('function');
    });

    it('should warn when the entrypoints directory is missing', async () => {
      const logger = mockOf<Logger>();
      pathExistsMock.mockResolvedValue(false);

      await resolveConfig({ logger }, 'build');

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Entrypoints directory not found'),
      );
    });
  });

  describe('imports.dirs', () => {
    const logger = mockOf<Logger>();

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
