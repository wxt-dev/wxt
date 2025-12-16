import type * as vite from 'vite';
import { visualizer } from '@aklinker1/rollup-plugin-visualizer';
import { ResolvedConfig } from '../../../../types';
import path from 'node:path';

let increment = 0;

export function bundleAnalysis(config: ResolvedConfig): vite.Plugin {
  return visualizer({
    template: 'raw-data',
    filename: path.resolve(
      config.analysis.outputDir,
      `${config.analysis.outputName}-${increment++}.json`,
    ),
  }) as vite.Plugin;
}

/**
 * @deprecated FOR TESTING ONLY.
 */
export function resetBundleIncrement() {
  increment = 0;
}
