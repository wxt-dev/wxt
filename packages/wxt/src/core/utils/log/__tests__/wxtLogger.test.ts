import { beforeEach, describe, expect, it } from 'vitest';
import { clearWarnSetForTesting, createWxtLogger } from '../wxtLogger';
import type { Logger } from '../../../../types';
import { LogLevels } from 'consola';
import { mock } from 'vitest-mock-extended';

describe('createWxtLogger', () => {
  beforeEach(clearWarnSetForTesting);

  describe('warnOnce', () => {
    it('should log with the given arguments the first time it is called, and not again for repeated calls with the same arguments', () => {
      const inner = mock<Logger>();
      const logger = createWxtLogger(inner);

      logger.warnOnce('some warning');
      logger.warnOnce('some warning');
      logger.warnOnce('some warning');

      expect(inner.warn).toHaveBeenCalledTimes(1);
      expect(inner.warn).toHaveBeenCalledWith('some warning');
    });

    it('should log separately for each distinct set of arguments', () => {
      const inner = mock<Logger>();
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
      const inner = mock<Logger>();
      const logger = createWxtLogger(inner);

      logger.warn('some warning');
      logger.warn('some warning');
      logger.warn('some warning');

      expect(inner.warn).toHaveBeenCalledTimes(3);
    });

    it('should not log the same warning multiple times when called on different instances', () => {
      const innerA = mock<Logger>();
      const innerB = mock<Logger>();
      const loggerA = createWxtLogger(innerA);
      const loggerB = createWxtLogger(innerB);

      loggerA.warnOnce('some warning');
      loggerB.warnOnce('some warning');

      expect(innerA.warn).toHaveBeenCalledTimes(1);
      expect(innerB.warn).not.toHaveBeenCalled();
    });
  });

  describe('delegation', () => {
    it.each(['debug', 'log', 'info', 'fatal', 'success'] as const)(
      'should pass calls through %s',
      (fn) => {
        const inner = mock<Logger>();
        const logger = createWxtLogger(inner);
        const message = 'some message';

        logger[fn](message);

        expect(inner[fn]).toHaveBeenCalledWith(message);
      },
    );

    it('should get and set level on the underlying logger', () => {
      const inner = mock<Logger>();
      const logger = createWxtLogger(inner);

      expect(logger.level).toBe(inner.level);

      logger.level = LogLevels.debug;

      expect(inner.level).toBe(LogLevels.debug);
    });
  });
});
