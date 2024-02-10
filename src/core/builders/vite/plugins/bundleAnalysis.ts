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
    filename: path.resolve(
      config.analysis.outputDir,
      `${config.analysis.outputName}-${increment++}.json`,
    ),
  });
}

/**
 * @deprecated FOR TESTING ONLY.
 */
export function resetBundleIncrement() {
  increment = 0;
}
