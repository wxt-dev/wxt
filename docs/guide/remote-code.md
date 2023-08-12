# Remote Code

WXT will automatically download and bundle imports with the `url:` prefix so the extension does not depend of remote code, [a requirement from Google for MV3](https://developer.chrome.com/docs/extensions/migrating/improve-security/#remove-remote-code).

## Google Analytics

For example, you can import google analytics:

```ts
// utils/google-analytics.ts
import 'url:https://www.googletagmanager.com/gtag/js?id=G-XXXXXX';

window.dataLayer = window.dataLayer || [];
// NOTE: This line is different from Google's documentation
window.gtag = function () {
  dataLayer.push(arguments);
};
gtag('js', new Date());
gtag('config', 'G-XXXXXX');
```

Then you can import this in your HTML files to enable Google Analytics:

```ts
// popup/main.ts
import '~/utils/google-analytics';

gtag('event', 'event_name', {
  key: 'value',
});
```
