import { parseHTML } from 'linkedom';
import { createEnvironment, Environment, EnvGlobals } from './environment';

export function createBrowserEnvironment(): Environment {
  return createEnvironment(getBrowserEnvironmentGlobals);
}

export function getBrowserEnvironmentGlobals(): EnvGlobals {
  const { window, document, global } = parseHTML(`
    <html>
      <head></head>
      <body></body>
    </html>
  `);
  return {
    ...global,
    window,
    document,
    self: global,
  };
}
