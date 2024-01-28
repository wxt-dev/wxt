import { InternalConfig } from '~/types';

export function getGlobals(
  config: Omit<InternalConfig, 'builder'>,
): Array<{ name: string; value: any; type: string }> {
  return [
    {
      name: 'MANIFEST_VERSION',
      value: config.manifestVersion,
      type: `2 | 3`,
    },
    {
      name: 'BROWSER',
      value: config.browser,
      type: `string`,
    },
    {
      name: 'CHROME',
      value: config.browser === 'chrome',
      type: `boolean`,
    },
    {
      name: 'FIREFOX',
      value: config.browser === 'firefox',
      type: `boolean`,
    },
    {
      name: 'SAFARI',
      value: config.browser === 'safari',
      type: `boolean`,
    },
    {
      name: 'EDGE',
      value: config.browser === 'edge',
      type: `boolean`,
    },
    {
      name: 'OPERA',
      value: config.browser === 'opera',
      type: `boolean`,
    },
    {
      name: 'COMMAND',
      value: config.command,
      type: `"build" | "serve"`,
    },
  ];
}

export function getEntrypointGlobals(entrypointName: string) {
  return [
    {
      name: 'entrypoint',
      value: entrypointName,
      type: `string`,
    },
  ];
}
