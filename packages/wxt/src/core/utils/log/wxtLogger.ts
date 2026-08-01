import type { Logger, WxtLogger } from '../../../types';

/**
 * Wraps a `Logger` with a `warnOnce`. The set of already-warned messages is
 * scoped to this wrapper instance, so it's reset whenever a new wrapper is
 * created, e.g. once per `resolveConfig` call.
 */
export function createWxtLogger(logger: Logger): WxtLogger {
  const warned = new Set<string>();

  return {
    get level() {
      return logger.level;
    },
    set level(value) {
      logger.level = value;
    },
    debug: (...args) => logger.debug(...args),
    log: (...args) => logger.log(...args),
    info: (...args) => logger.info(...args),
    warn: (...args) => logger.warn(...args),
    error: (...args) => logger.error(...args),
    fatal: (...args) => logger.fatal(...args),
    success: (...args) => logger.success(...args),
    warnOnce: (...args: any[]) => {
      const key = JSON.stringify(args);
      if (warned.has(key)) return;
      warned.add(key);
      logger.warn(...args);
    },
  };
}
