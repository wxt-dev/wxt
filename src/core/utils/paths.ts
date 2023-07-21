import nodePath from 'node:path';
import * as vite from 'vite';

/**
 * Converts system paths to normalized bundler path. On windows and unix, this returns paths with /
 * instead of \.
 */
export function normalizePath(path: string): string {
  return vite.normalizePath(path);
}

/**
 * Given a normalized path, convert it to the system path style. On Windows, switch to \, otherwise use /.
 */
export function unnormalizePath(path: string): string {
  return nodePath.normalize(path);
}
