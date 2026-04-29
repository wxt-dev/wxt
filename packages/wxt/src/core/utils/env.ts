import { expand } from 'dotenv-expand';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import type { TargetBrowser } from '../../types';

/** Load environment files based on the current mode and browser. */
export function loadEnv(mode: string, browser: TargetBrowser) {
  const envFiles = [
    // List is ordered with general files first, specific ones last, so the more
    // specific files override the more general ones in the loop below.
    `.env`,
    `.env.local`,
    `.env.${mode}`,
    `.env.${mode}.local`,
    `.env.${browser}`,
    `.env.${browser}.local`,
    `.env.${mode}.${browser}`,
    `.env.${mode}.${browser}.local`,
  ];

  const parsed = Object.fromEntries<string>(
    envFiles.flatMap((filePath) => {
      if (!existsSync(filePath)) return [];

      try {
        const content = readFileSync(filePath, 'utf-8');
        const parsedEnv = parseEnv(content);
        return Object.entries(parsedEnv) as [string, string][];
      } catch {
        return [];
      }
    }),
  );

  expand({
    parsed,
  });

  return parsed;
}
