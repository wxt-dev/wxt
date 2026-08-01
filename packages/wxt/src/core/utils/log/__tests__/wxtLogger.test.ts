import { describe, expect, it, vi } from 'vitest';
import { createWxtLogger } from '../wxtLogger';
import type { Logger } from '../../../../types';
import { LogLevels } from 'consola';

function fakeLogger(): Logger {
  return {
    debug: vi.fn(),
    log: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    success: vi.fn(),
    level: LogLevels.info,
  };
}

describe('createWxtLogger', () => {
  describe('warnOnce', () => {
    it('should log with the given arguments the first time it is called, and not again for repeated calls with the same arguments', () => {
      const inner = fakeLogger();
      const logger = createWxtLogger(inner);

      logger.warnOnce('some warning');
      logger.warnOnce('some warning');
      logger.warnOnce('some warning');

      expect(inner.warn).toHaveBeenCalledTimes(1);
      expect(inner.warn).toHaveBeenCalledWith('some warning');
    });

    it('should log separately for each distinct set of arguments', () => {
      const inner = fakeLogger();
      const logger = createWxtLogger(inner);

      logger.warnOnce('warning A');
      logger.warnOnce('warning B');
      logger.warnOnce('warning A');
      logger.warnOnce('warning B');

      expect(inner.warn).toHaveBeenCalledTimes(2);
      expect(inner.warn).toHaveBeenNthCalledWith(1, 'warning A');
      expect(inner.warn).toHaveBeenNthCalledWith(2, 'warning B');
    });

    it('should not affect regular warn calls, which are never deduped', () => {
      const inner = fakeLogger();
      const logger = createWxtLogger(inner);

      logger.warn('some warning');
      logger.warn('some warning');
      logger.warn('some warning');

      expect(inner.warn).toHaveBeenCalledTimes(3);
    });

    it('should scope deduping to a single createWxtLogger instance, not share it across separate instances', () => {
      // `resolveConfig` calls `createWxtLogger` once per resolve/reload, so
      // each instance's dedupe state should be independent of the others.
      const innerA = fakeLogger();
      const loggerA = createWxtLogger(innerA);
      loggerA.warnOnce('some warning');

      const innerB = fakeLogger();
      const loggerB = createWxtLogger(innerB);
      loggerB.warnOnce('some warning');

      expect(innerA.warn).toHaveBeenCalledTimes(1);
      expect(innerB.warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('delegation', () => {
    it('should pass every call through for non-warnOnce methods', () => {
      const inner = fakeLogger();
      const logger = createWxtLogger(inner);

      logger.debug('debug');
      logger.log('log');
      logger.info('info');
      logger.error('error');
      logger.fatal('fatal');
      logger.success('success');

      expect(inner.debug).toHaveBeenCalledWith('debug');
      expect(inner.log).toHaveBeenCalledWith('log');
      expect(inner.info).toHaveBeenCalledWith('info');
      expect(inner.error).toHaveBeenCalledWith('error');
      expect(inner.fatal).toHaveBeenCalledWith('fatal');
      expect(inner.success).toHaveBeenCalledWith('success');
    });

    it('should get and set level on the underlying logger', () => {
      const inner = fakeLogger();
      const logger = createWxtLogger(inner);

      expect(logger.level).toBe(inner.level);

      logger.level = LogLevels.debug;

      expect(inner.level).toBe(LogLevels.debug);
    });
  });
});
