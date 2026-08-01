import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveConfig } from '../resolve-config';
import type { Logger } from '../../types';
import { mock } from 'vitest-mock-extended';
import { loadConfig } from 'c12';
import { pathExists } from '../utils/fs';

vi.mock('../utils/fs');
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
});
