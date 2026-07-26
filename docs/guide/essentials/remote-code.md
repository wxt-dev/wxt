# Remote Code

WXT will automatically download and bundle imports with the `url:` prefix so the extension does not depend on remote code, [a requirement from Google for MV3](https://developer.chrome.com/docs/extensions/migrating/improve-security/#remove-remote-code).

## Integrity Hashes

Every URL import must pin an integrity hash. Whatever you import is bundled into your extension and ships to your users, so an unpinned import means a compromised or hijacked CDN can put arbitrary code in your next release without you noticing.

The hash goes between `url` and the URL, prefixed with `#`:

```ts
import 'url#sha256-kmHvs0B+OpCW5GVHUNjv9rOmY0IvSIRcf7zGUDTDQM8=:https://code.jquery.com/jquery-3.7.1.slim.min.js';
```

`sha256`, `sha384`, and `sha512` are supported, in either base64 (the same format as [Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity), which most CDNs publish) or hex.

If you don't know the hash yet, import the URL without one. The build will fail and print the hash of the file currently being served:

```
URL imports must pin an integrity hash: "url:https://code.jquery.com/jquery-3.7.1.slim.min.js"

  import 'url#sha256-kmHvs0B+OpCW5GVHUNjv9rOmY0IvSIRcf7zGUDTDQM8=:https://code.jquery.com/jquery-3.7.1.slim.min.js';
```

:::warning
A hash locks in whatever is served today — it does not make untrusted code safe. Review the file before pinning it.
:::

When the remote file changes, the build fails instead of silently bundling the new version:

```
Integrity check failed for "https://code.jquery.com/jquery-3.7.1.slim.min.js".

  Expected: sha256-kmHvs0B+OpCW5GVHUNjv9rOmY0IvSIRcf7zGUDTDQM8=
  Received: sha256-b6WuS8lqRB1JlP0z1BjCXGKtIFgKPKcJPvXCLpxLxeM=

The remote file changed since you added it. Review the new file, and if you trust it, update the hash in your import.
```

Run your build on a schedule in CI to find out when a remote dependency changes, rather than at release time.

## Google Analytics

For example, you can import Google Analytics:

```ts
// utils/google-analytics.ts
import 'url#sha256-XXXXXX:https://www.googletagmanager.com/gtag/js?id=G-XXXXXX';

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

:::warning
`gtag/js` is regenerated frequently and its hash changes often, so pinning it means updating the hash regularly. Prefer an NPM package where one exists.
:::
