import { InternalConfig } from '../types';
import paths from 'vite-tsconfig-paths';

export function tsconfigPaths(config: InternalConfig) {
  return paths();
}
