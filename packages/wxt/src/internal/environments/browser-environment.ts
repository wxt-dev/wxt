import { createEnvironment, Environment, EnvGlobals } from './environment';

export function createBrowserEnvironment(): Environment {
  return createEnvironment(getBrowserEnvironmentGlobals);
}

/**
 * Entrypoints are imported at build time just to read their options, so the
 * browser globals only need to not throw when top-level code touches them. They
 * are permissive stubs, not a DOM implementation.
 */
export function getBrowserEnvironmentGlobals(): EnvGlobals {
  const location = createBuildTimeLocation('http://localhost/');
  const document = createStub();
  const window: any = createStub({ location, document });
  window.window = window;
  window.self = window;

  return {
    window,
    self: window,
    document,
    location,
    ...Object.fromEntries(
      stubbedGlobalNames.map((name) => [name, createStub()]),
    ),
  };
}

const stubbedGlobalNames = [
  'Node',
  'Element',
  'HTMLElement',
  'Document',
  'DocumentFragment',
  'ShadowRoot',
  'Event',
  'CustomEvent',
  'DOMParser',
  'MutationObserver',
  'ResizeObserver',
  'IntersectionObserver',
  'customElements',
];

/**
 * Creates a value where reading any property, calling it, or constructing it
 * returns another stub. `overrides` are real values for specific properties.
 */
function createStub(overrides: Record<string, unknown> = {}): any {
  // Must be a regular function so it can be called, constructed, and extended
  const target = function () {};
  const stub: any = new Proxy(target, {
    get(_, prop) {
      if (typeof prop === 'string' && prop in overrides) return overrides[prop];
      if (prop === 'prototype') return target.prototype;
      // Not a thenable, otherwise awaiting a stub never settles
      if (prop === 'then' || prop === 'toJSON') return undefined;
      if (prop === Symbol.toPrimitive) return () => '';
      if (prop === Symbol.iterator) return function* () {};
      if (prop === Symbol.hasInstance) return () => false;
      if (typeof prop === 'symbol') return undefined;
      return createStub();
    },
    set: () => true,
    deleteProperty: () => true,
    apply: () => createStub(),
    construct: () => createStub(),
  });
  return stub;
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
