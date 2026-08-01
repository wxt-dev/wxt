import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveConfig } from '../resolve-config';
import type { Logger } from '../../types';

function fakeLogger(): Logger {
  return {
    debug: vi.fn(),
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    success: vi.fn(),
    level: 3,
  };
}

describe('resolveConfig', () => {
  const tempDirs: string[] = [];

  /**
   * Creates an empty temp project dir, with an `entrypoints/` dir so
   * `resolveConfig` doesn't warn about it being missing.
   */
  function tempProjectDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'wxt-resolve-config-test-'));
    tempDirs.push(dir);
    mkdirSync(join(dir, 'entrypoints'));
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  describe('logger', () => {
    it('should wrap the resolved logger with warnOnce', async () => {
      const logger = fakeLogger();

      const config = await resolveConfig(
        { root: tempProjectDir(), configFile: false, logger },
        'build',
      );

      expect(config.logger.warnOnce).toBeTypeOf('function');
    });

    it('should give each resolved config its own warnOnce dedupe scope, instead of sharing one across resolves', async () => {
      const logger = fakeLogger();
      const root = tempProjectDir();

      const configA = await resolveConfig(
        { root, configFile: false, logger },
        'build',
      );
      configA.logger.warnOnce('some warning');
      configA.logger.warnOnce('some warning');

      const configB = await resolveConfig(
        { root, configFile: false, logger },
        'build',
      );
      configB.logger.warnOnce('some warning');

      // Simulates `wxt.reloadConfig()` calling `resolveConfig` again: each
      // resolve wraps the logger in a new `WxtLogger`, so the message is
      // logged once per resolve (2 total), not deduped across resolves.
      expect(logger.warn).toHaveBeenCalledTimes(2);
    });
  });

  describe('logMissingDir', () => {
    it('should warn (through the wrapped logger) when the entrypoints directory is missing', async () => {
      const logger = fakeLogger();
      const root = mkdtempSync(join(tmpdir(), 'wxt-resolve-config-test-'));
      tempDirs.push(root);

      await resolveConfig({ root, configFile: false, logger }, 'build');

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Entrypoints directory not found'),
      );
    });
  });
});
