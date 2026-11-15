/**
 * Import this FIRST in test files that need a DOM. It registers happy-dom's
 * globals before any module under test is evaluated, since some dependencies
 * capture `globalThis.document` when they are first imported.
 */
import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register();

export const unregisterHappyDom = () => GlobalRegistrator.unregister();
