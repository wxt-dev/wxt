import { beforeEach, describe, expect, it, vi } from 'vitest';
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

  describe('actualBrowser', () => {
    it.each<[string, string]>([
      ['chrome', 'chromium'],
      ['edge', 'chromium'],
      ['brave', 'chromium'],
      ['opera', 'chromium'],
      ['chromium', 'chromium'],
      ['firefox', 'firefox'],
      ['safari', 'safari'],
      ['ios', 'safari'],
    ])(
      'should resolve browser "%s" to actualBrowser "%s"',
      async (browser, expected) => {
        const config = await resolveConfig({ browser }, 'build');

        expect(config.actualBrowser).toBe(expected);
      },
    );

    it('should resolve unknown browsers to themselves', async () => {
      const config = await resolveConfig({ browser: 'waterfox' }, 'build');

      expect(config.actualBrowser).toBe('waterfox');
    });

    it('should let a custom targetBrowserMap entry win over the defaults', async () => {
      const config = await resolveConfig(
        {
          browser: 'waterfox',
          targetBrowserMap: { waterfox: 'firefox' },
        },
        'build',
      );

      expect(config.actualBrowser).toBe('firefox');
    });

    it('should not change the raw browser label', async () => {
      const config = await resolveConfig({ browser: 'ios' }, 'build');

      expect(config.browser).toBe('ios');
    });

    it('should keep the raw browser label in the output directory', async () => {
      const config = await resolveConfig({ browser: 'ios' }, 'build');

      expect(config.outDir).toContain(`ios-mv${config.manifestVersion}`);
    });

    it('should default the manifest version based on the actual browser', async () => {
      const config = await resolveConfig({ browser: 'ios' }, 'build');

      expect(config.actualBrowser).toBe('safari');
      expect(config.manifestVersion).toBe(2);
    });
  });
});
