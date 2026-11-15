import * as litejs from '@litejs/dom';

import { parseHTML } from '../../internal-utils/html-utils';
import { createEnvironment, Environment, EnvGlobals } from './environment';

export function createBrowserEnvironment(): Environment {
  return createEnvironment(getBrowserEnvironmentGlobals);
}

export function getBrowserEnvironmentGlobals(): EnvGlobals {
  const { document } = parseHTML(`
    <html>
      <head></head>
      <body></body>
    </html>
  `);
  const location = createBuildTimeLocation('http://localhost/');
  const global: EnvGlobals = {
    Node: litejs.Node,
    HTMLElement: litejs.HTMLElement,
    Element: litejs.HTMLElement,
    DocumentFragment: litejs.DocumentFragment,
    DOMParser: litejs.DOMParser,
    document,
    location,
  };
  const window: EnvGlobals = { ...global };
  window.window = window;
  window.self = window;
  return { ...window, window, self: window };
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
