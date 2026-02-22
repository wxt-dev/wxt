/**
 * The fake browser is automatically used as a mock for the `wxt/browser` import
 * when using `wxt/testing/vitest-plugin` with Vitest. It is also setup to
 * reset all state before each test.
 *
 * This module is just a re-export of [@webext-core/fake-browser](https://webext-core.aklinker1.io/fake-browser/triggering-events).
 *
 * @module wxt/testing/fake-browser
 */

export { fakeBrowser, type FakeBrowser } from '@webext-core/fake-browser';
