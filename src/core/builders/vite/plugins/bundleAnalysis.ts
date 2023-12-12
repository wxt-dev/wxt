import type * as vite from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

let increment = 0;

export function bundleAnalysis(): vite.Plugin {
  return visualizer({
    emitFile: true,
    template: 'raw-data',
    filename: `stats-${increment++}.json`,
  }) as vite.Plugin;
}
