import type { chrome } from 'chrome';
import type { Firefox } from './gen/firefox';
import { Browser } from './gen';

export const browser: typeof Browser;
export { Browser };

export const chrome: chrome = browser;
export const firefox: Firefox = browser;
