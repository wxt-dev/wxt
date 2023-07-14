import { InternalConfig } from '../types';
import paths from 'vite-tsconfig-paths';

export function tsconfigPaths(config: InternalConfig) {
  const fn: typeof paths =
    typeof paths === 'function' ? paths : (paths as any).default;
  return fn({
    root: config.root,
  });
}
