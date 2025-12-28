export interface Debug {
  scoped: (scope: string) => Debug;

  (...args: unknown[]): void;
}

function createDebug(scopes: string[]): Debug {
  const debug = (...args: unknown[]) => {
    const scope = scopes.join(':');

    if (
      process.env.DEBUG === '1' ||
      process.env.DEBUG === 'true' ||
      scope.startsWith(process.env.DEBUG ?? '@NOT')
    ) {
      const params = scope ? [`\x1b[31m${scope}\x1b[0m`, ...args] : args;
      console.log(...params);
    }
  };

  debug.scoped = (scope: string) => createDebug([...scopes, scope]);

  return debug;
}

export const debug = createDebug(['@wxt-dev/runner']);
