import fs from 'node:fs';
import { expand } from 'dotenv-expand';
import { parseEnv } from './parse-env';
import type { TargetBrowser } from '../../types';

/** Load environment files based on the current mode and browser. */
export function loadEnv(mode: string, browser: TargetBrowser) {
  // Ordered least-specific → most-specific so that later files
  // overwrite earlier ones via Object.assign.
  const envFiles = [
    `.env`,
    `.env.local`,
    `.env.${mode}`,
    `.env.${mode}.local`,
    `.env.${browser}`,
    `.env.${browser}.local`,
    `.env.${mode}.${browser}`,
    `.env.${mode}.${browser}.local`,
  ];

  const parsed: Record<string, string> = {};

  for (const file of envFiles) {
    try {
      Object.assign(parsed, parseEnv(fs.readFileSync(file, 'utf-8')));
    } catch {
      // File doesn't exist, skip
    }
  }

  return expand({ parsed });
}
