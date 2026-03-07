import fs from 'node:fs';
import { expand } from 'dotenv-expand';
import { parseEnv } from './parse-env';
import type { TargetBrowser } from '../../types';

/** Load environment files based on the current mode and browser. */
export async function loadEnv(mode: string, browser: TargetBrowser) {
  const envFiles = [
    `.env.${mode}.${browser}.local`,
    `.env.${mode}.${browser}`,
    `.env.${browser}.local`,
    `.env.${browser}`,
    `.env.${mode}.local`,
    `.env.${mode}`,
    `.env.local`,
    `.env`,
  ];

  const parsed: Record<string, string> = {};

  // Load env files in reverse order so that files on top override files below
  for (const file of envFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const fileParsed = await parseEnv(content);
      Object.assign(parsed, fileParsed);
    } catch {
      // File doesn't exist or can't be read, skip it
    }
  }

  // Apply dotenv-expand to handle variable expansion
  return expand({ parsed });
}
