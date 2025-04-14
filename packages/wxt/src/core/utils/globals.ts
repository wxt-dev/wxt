import { ResolvedConfig } from '../../types';

export function getGlobals(
  config: ResolvedConfig,
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
      type:
        config.targetBrowsers.length === 0
          ? 'string'
          : config.targetBrowsers.map((browser) => `"${browser}"`).join(' | '),
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
      name: 'ENTRYPOINT',
      value: entrypointName,
      type: `string`,
    },
  ];
}
