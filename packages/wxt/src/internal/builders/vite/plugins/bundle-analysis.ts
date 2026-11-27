import path from 'node:path';

import { visualizer } from '@aklinker1/rollup-plugin-visualizer';
import type * as vite from 'vite';

import type { ResolvedConfig } from '../../../../types';

let increment = 0;

export const bundleAnalysis = (config: ResolvedConfig): vite.Plugin => {
  return visualizer({
    template: 'raw-data',
    filename: path.resolve(
      config.analysis.outputDir,
      `${config.analysis.outputName}-${increment++}.json`,
    ),
  }) as vite.Plugin;
};

/** @internal FOR TESTING ONLY. */
export const resetBundleIncrement = () => {
  increment = 0;
};
