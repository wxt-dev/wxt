export interface Analytics {
  /** Report a page change */
  page: (url: string | URL) => void;
  /** Report a custom event */
  track: (eventName: string, eventProperties: string) => void;
  /** Save information about the user */
  identify: (userId: string, userProperties?: Record<string, string>) => void;
}

export interface AnalyticsConfig {
  /** Array of providers to send analytics to. */
  providers: AnalyticsProvider[];
  /** Enable debug logs and other provider-specific debugging features. */
  debug?: boolean;
  /** Extension version, defaults to `browser.runtime.getManifest().version`. */
  version?: string;
}

export type AnalyticsProvider = (
  analytics: Analytics,
  config: AnalyticsConfig,
) => {
  /** Upload a page view event */
  page: (event: AnalyticsPageViewEvent) => Promise<void>;
  /** Upload a custom event */
  track: (event: AnalyticsTrackEvent) => Promise<void>;
  /** Upload or save information about the user */
  identify: (event: AnalyticsIdentifyEvent) => Promise<void>;
};

export interface BaseAnalyticsEvent {
  /** Identifier of the session the event was fired from */
  sessionId: string;
  /** `Date.now()` of when the event was reported */
  time: number;
}

export interface AnalyticsPageViewEvent extends BaseAnalyticsEvent {
  url: string;
  sessionId: string;
  title: string;
  location: string;
}

export interface AnalyticsTrackEvent extends BaseAnalyticsEvent {
  eventName: string;
  eventProperties: Record<string, string>;
}

export interface AnalyticsIdentifyEvent extends BaseAnalyticsEvent {}
