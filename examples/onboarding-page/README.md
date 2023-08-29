# Onboarding Page Example

This directory contains a project setup to build an unlisted HTML page, `onboarding.html`, and open that page when the extension is installed.

1. Create the unlisted entrypoint, `entrypoints/onboarding/index.html`. This page will be built to `/onboarding.html` in the output directory.

2. In `wxt.config.ts`, add the `tabs` permission to the manifest. We will use this permission to open the onboarding page in the next step.

3. In the background script, listen for the install event and open a tab to the onboarding page using `browser.tabs.create` and `browser.tabs.getURL` to get the full URL to the onboarding page.

4. Inside `entrypoints/onboarding/main.ts`, grab the option page's URL with `browser.runtime.getURL` and set the anchor's HREF so that when clicked, you go from the onboarding page to the options page.
