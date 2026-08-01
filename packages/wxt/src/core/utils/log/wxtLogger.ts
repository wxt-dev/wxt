import type { Logger, WxtLogger } from '../../../types';

const warned = new Set<string>();

/**
 * Wraps a `Logger` with a `warnOnce`. The set of already-warned messages is
 * scoped to this wrapper instance, so it's reset whenever a new wrapper is
 * created, e.g. once per `resolveConfig` call.
 */
export function createWxtLogger(logger: Logger): WxtLogger {
  return {
    get level() {
      return logger.level;
    },
    set level(value) {
      logger.level = value;
    },
    debug: logger.debug,
    log: logger.log.bind(logger),
    info: logger.info.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
    fatal: logger.fatal.bind(logger),
    success: logger.success.bind(logger),
    warnOnce: (...args: any[]) => {
      const key = JSON.stringify(args);
      if (warned.has(key)) return;
      warned.add(key);
      logger.warn(...args);
    },
  };
}
