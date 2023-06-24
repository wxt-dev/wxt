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
      type: `"chromium" | "firefox"`,
    },
    {
      name: '__IS_CHROMIUM__',
      value: config.browser === 'chromium',
      type: `boolean`,
    },
    {
      name: '__IS_FIREFOX__',
      value: config.browser === 'firefox',
      type: `boolean`,
    },
  ];
}
