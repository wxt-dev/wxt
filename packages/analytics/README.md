# WXT Analytics

Add analytics, like google analytics, to your WXT extension.

## Supported Analytics Services

- Google Analytics (Measurement Protocol)
- Umami

## Installation

Install the NPM package:

```bash
pnpm i @wxt-dev/analytics
```

Then add the module to your `wxt.config.ts` file:

```ts
export default defineConfig({
  modules: ['@wxt-dev/analytics'],
});
```

Create an `app.config.ts` file and fill out the required config:

```ts
// <srcDir>/app.config.ts
export default defineAppConfig({
  analytics: {
    debug: true,
    providers: [
      // ...
    ],
  },
});
```

## Providers

### Google Analytics (Measurement Protocol)

Follow [Google's documentation](https://developer.chrome.com/docs/extensions/how-to/integrate/google-analytics-4#setup-credentials) to obtain your credentials:

```ts
import { googleAnalytics4 } from '@wxt-dev/analytics/providers/google-analytics-4';

export default defineAppConfig({
  analytics: {
    providers: [
      googleAnalytics4({
        apiSecret: '...',
        measurementId: '...',
      }),
    ],
  },
});
```

> [Why use the Measurement Protocol instead of GTag?](https://developer.chrome.com/docs/extensions/how-to/integrate/google-analytics-4#measurement-protocol)

### Umami

```ts
import { umami } from '@wxt-dev/analytics/providers/umami';

export default defineAppConfig({
  analytics: {
    providers: [
      umami({
        baseUrl: 'https://your-domain.com',
        websiteId: '...',
        hostname: '...',
      }),
    ],
  },
});
```
