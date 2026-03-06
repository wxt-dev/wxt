import { readFileSync, existsSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { expand } from 'dotenv-expand';
import type { TargetBrowser } from '../../types';

/** Load environment files based on the current mode and browser. */
export function loadEnv(mode: string, browser: TargetBrowser) {
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

  // We reversed the list so that more specific files take priority over more general ones.
  const parsed = Object.fromEntries(
    envFiles
      .slice()
      .reverse()
      .flatMap((filePath) => {
        if (!existsSync(filePath)) return [];

        try {
          const content = readFileSync(filePath, 'utf-8');
          const parsedEnv = parseEnv(content);
          return Object.entries(parsedEnv);
        } catch {
          return [];
        }
      }),
  ) as Record<string, string>;

  // We prepare the environment for variable expansion ($VAR)
  const processEnv = { ...process.env } as Record<string, string>;
  expand({
    parsed,
    processEnv,
  });

  return parsed;
}
