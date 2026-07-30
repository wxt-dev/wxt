import type { Logger, WxtLogger } from '../../../types';

/**
 * Wraps a getter for the current `Logger` with a `warnOnce`. The set already
 * warned messages is scoped to this wrapper instance, so it's only reset when a
 * new wrapper is created, not every time the config is resolved/reloaded.
 */
export function createWxtLogger(getLogger: () => Logger): WxtLogger {
  const warned = new Set<string>();

  return {
    get level() {
      return getLogger().level;
    },
    set level(value) {
      getLogger().level = value;
    },
    debug: (...args) => getLogger().debug(...args),
    log: (...args) => getLogger().log(...args),
    info: (...args) => getLogger().info(...args),
    warn: (...args) => getLogger().warn(...args),
    error: (...args) => getLogger().error(...args),
    fatal: (...args) => getLogger().fatal(...args),
    success: (...args) => getLogger().success(...args),
    warnOnce: (...args: any[]) => {
      const key = JSON.stringify(args);
      if (warned.has(key)) return;
      warned.add(key);
      getLogger().warn(...args);
    },
  };
}
