import type * as vite from 'vite';
import { visualizer } from '@aklinker1/rollup-plugin-visualizer';
import { ResolvedConfig } from '~/types';
import path from 'node:path';

let increment = 0;

export function bundleAnalysis(config: ResolvedConfig): vite.Plugin {
  // @ts-expect-error: Vite/Rollup type mismatch, but it's fine.
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
