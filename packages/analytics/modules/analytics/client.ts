import { defineWxtPlugin } from 'wxt/sandbox';
import { Analytics } from './types';

export let analytics: Analytics;

export default <any>defineWxtPlugin(() => {
  const isBackground = globalThis.window == null; // TODO: Support MV2
  analytics = isBackground
    ? createBackgroundAnalytics()
    : createAnalyticsForwarder();
});

function createBackgroundAnalytics(): Analytics {
  return {
    identify: () => {},
    page: () => {},
    track: () => {},
  };
}

function createAnalyticsForwarder(): Analytics {
  return {
    identify: () => {},
    page: () => {},
    track: () => {},
  };
}
