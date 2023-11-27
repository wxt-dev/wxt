import { InternalConfig } from '~/types';

export function getGlobals(
  config: Omit<InternalConfig, 'builder'>,
): Array<{ name: string; value: any; type: string }> {
  return [
    {
      name: surroundInUnderscore('MANIFEST_VERSION'),
      value: config.manifestVersion,
      type: `2 | 3`,
    },
    {
      name: surroundInUnderscore('BROWSER'),
      value: config.browser,
      type: `string`,
    },
    {
      name: surroundInUnderscore('IS_CHROME'),
      value: config.browser === 'chrome',
      type: `boolean`,
    },
    {
      name: surroundInUnderscore('IS_FIREFOX'),
      value: config.browser === 'firefox',
      type: `boolean`,
    },
    {
      name: surroundInUnderscore('IS_SAFARI'),
      value: config.browser === 'safari',
      type: `boolean`,
    },
    {
      name: surroundInUnderscore('IS_EDGE'),
      value: config.browser === 'edge',
      type: `boolean`,
    },
    {
      name: surroundInUnderscore('IS_OPERA'),
      value: config.browser === 'opera',
      type: `boolean`,
    },
    {
      name: surroundInUnderscore('COMMAND'),
      value: config.command,
      type: `"build" | "serve"`,
    },
  ];
}

export function getEntrypointGlobals(
  config: InternalConfig,
  entrypointName: string,
) {
  return [
    {
      name: surroundInUnderscore('ENTRYPOINT'),
      value: entrypointName,
      type: `string`,
    },
  ];
}

/**
 * Don't hardcode the complete name so that the string litterals in this file aren't replaced during
 * tests (which causes syntax errors), only during builds.
 */
function surroundInUnderscore(name: string): string {
  return `__${name}__`;
}
