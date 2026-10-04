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
  const location = createBuildTimeLocation('http://localhost/');
  window.location = location as Location & string;
  global.location = location;
  return {
    ...global,
    window,
    document,
    self: global,
    location,
  };
}

/**
 * A read-only stand-in for `location`. There is no page to navigate at build
 * time, so `assign`, `reload` and `replace` do nothing rather than throw.
 */
function createBuildTimeLocation(href: string): Location {
  const url = new URL(href);
  return {
    ancestorOrigins: Object.assign([], {
      contains: () => false,
      item: () => null,
    }) as unknown as DOMStringList,
    hash: url.hash,
    host: url.host,
    hostname: url.hostname,
    href: url.href,
    origin: url.origin,
    pathname: url.pathname,
    port: url.port,
    protocol: url.protocol,
    search: url.search,
    assign: () => {},
    reload: () => {},
    replace: () => {},
    toString: () => url.href,
  };
}
