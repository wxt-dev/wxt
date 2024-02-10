import type * as vite from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { ResolvedConfig } from '~/types';
import path from 'node:path';

let increment = 0;

export function bundleAnalysis(
  config: Omit<ResolvedConfig, 'builder'>,
): vite.Plugin {
  return visualizer({
    template: 'raw-data',
    filename: path.resolve(config.outDir, `stats-${increment++}.json`),
  }) as vite.Plugin;
}

/**
 * @deprecated FOR TESTING ONLY.
 */
export function resetBundleIncrement() {
  increment = 0;
}
