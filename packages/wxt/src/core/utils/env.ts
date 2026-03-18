import { readFileSync, existsSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { expand } from 'dotenv-expand';
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

  // Make a copy of `process.env` so that `dotenv-expand` doesn't re-assign the
  // expanded values to the global `process.env`.
  const processEnv = { ...process.env } as Record<string, string>;

  expand({
    parsed,
    processEnv,
  });

  return parsed;
}
