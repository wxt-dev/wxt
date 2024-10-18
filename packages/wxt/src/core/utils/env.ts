import { config } from 'dotenv';
import type { TargetBrowser } from '../../types';

/**
 * Load environment files based on the current mode and browser.
 */
export function loadEnv(mode: string, browser: TargetBrowser) {
  return config({
    path: [
      `.env.${mode}.${browser}.local`,
      `.env.${mode}.${browser}`,
      `.env.${mode}.local`,
      `.env.${mode}`,
      `.env.local`,
      `.env`,
    ],
  });
}
