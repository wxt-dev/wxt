import { fakeBrowser } from '@webext-core/fake-browser';

import { getBrowserEnvironmentGlobals } from './browser-environment';
import type { Environment } from './environment';
import { createEnvironment } from './environment';

export const createExtensionEnvironment = (): Environment => {
  return createEnvironment(getExtensionEnvironmentGlobals);
};

export const getExtensionEnvironmentGlobals = () => {
  return {
    ...getBrowserEnvironmentGlobals(),
    chrome: fakeBrowser,
    browser: fakeBrowser,
  };
};
