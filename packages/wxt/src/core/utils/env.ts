import { config } from 'dotenv';

/**
 * Load environment files based on the current mode.
 */
export function loadEnv(mode: string) {
  return config({
    path: [`.env`, `.env.local`, `.env.${mode}`, `.env.${mode}.local`],
  });
}
