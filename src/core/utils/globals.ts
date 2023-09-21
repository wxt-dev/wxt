import { InternalConfig } from '../types';

export function getGlobals(
  config: InternalConfig,
): Array<{ name: string; value: any; type: string }> {
  return [
    {
      name: '__MANIFEST_VERSION__',
      value: config.manifestVersion,
      type: `2 | 3`,
    },
    {
      name: '__BROWSER__',
      value: config.browser,
      type: `string`,
    },
    {
      name: '__IS_CHROME__',
      value: config.browser === 'chrome',
      type: `boolean`,
    },
    {
      name: '__IS_FIREFOX__',
      value: config.browser === 'firefox',
      type: `boolean`,
    },
    {
      name: '__IS_SAFARI__',
      value: config.browser === 'safari',
      type: `boolean`,
    },
    {
      name: '__IS_EDGE__',
      value: config.browser === 'edge',
      type: `boolean`,
    },
    {
      name: '__IS_OPERA__',
      value: config.browser === 'opera',
      type: `boolean`,
    },
    {
      name: '__COMMAND__',
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
      name: '__ENTRYPOINT__',
      value: entrypointName,
      type: `string`,
    },
  ];
}
