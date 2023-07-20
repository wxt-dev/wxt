import originalBrowser, { Browser, Runtime } from 'webextension-polyfill';

export interface AugmentedBrowser extends Browser {
  runtime: ProjectRuntime;
}

export interface ProjectRuntime extends Runtime.Static {
  // Overriden per-project
}

export const browser: AugmentedBrowser = originalBrowser;
