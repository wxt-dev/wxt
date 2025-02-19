import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import type { TargetBrowser } from '../../types';

/**
 * Load environment files based on the current mode and browser.
 */
export function loadEnv(mode: string, browser: TargetBrowser) {
  return expand(
    config({
      // Files on top override files below
      path: [
        `.env.${mode}.${browser}.local`,
        `.env.${mode}.${browser}`,
        `.env.${browser}.local`,
        `.env.${browser}`,
        `.env.${mode}.local`,
        `.env.${mode}`,
        `.env.local`,
        `.env`,
      ],
    }),
  );
}
