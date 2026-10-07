import { fakeBrowser } from '@webext-core/fake-browser';
import { getBrowserEnvironmentGlobals } from './browser-environment';
import { createEnvironment, Environment } from './environment';

export function createExtensionEnvironment(): Environment {
  return createEnvironment(getExtensionEnvironmentGlobals);
}

export function getExtensionEnvironmentGlobals() {
  return {
    ...getBrowserEnvironmentGlobals(),
    chrome: fakeBrowser,
    browser: fakeBrowser,
  };
}
