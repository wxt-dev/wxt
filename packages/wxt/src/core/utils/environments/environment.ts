export interface Environment {
  setup: () => () => void;
  run: <T>(fn: () => Promise<T>) => Promise<T>;
}

export function createEnvironment(getGlobals: () => EnvGlobals): Environment {
  const setup = () => {
    console.log('SETUP');
    const envGlobals = getGlobals();
    const ogGlobals = getOgGlobals(envGlobals);
    applyGlobals(envGlobals);

    return () => {
      applyGlobals(ogGlobals);
      console.log('TEARDOWN');
    };
  };
  const run = async (fn: () => any) => {
    const teardown = setup();
    try {
      return await fn();
    } finally {
      teardown();
    }
  };
  return {
    setup,
    run,
  };
}

export type EnvGlobals = Record<string, any>;

export function getOgGlobals(envGlobals: EnvGlobals): EnvGlobals {
  return Object.keys(envGlobals).reduce<typeof envGlobals>((acc, key) => {
    // @ts-expect-error: Untyped key on globalThis
    acc[key] = globalThis[key];
    return acc;
  }, {});
}

export function applyGlobals(globals: EnvGlobals): void {
  Object.entries(globals).forEach(([key, envValue]) => {
    try {
      // @ts-expect-error: Untyped key on globalThis
      globalThis[key] = envValue;
    } catch (err) {
      // ignore any globals that can't be set
    }
  });
}
