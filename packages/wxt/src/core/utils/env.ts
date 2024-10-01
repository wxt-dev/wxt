import { config } from 'dotenv';

/**
 * Load environment files based on the current mode.
 */
export function loadEnv(mode: string) {
  return config({
    path: [`.env.${mode}.local`, `.env.${mode}`, `.env.local`, `.env`],
  });
}
