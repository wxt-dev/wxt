import { Plugin } from 'vite';
import { InternalConfig } from '../types';
import { relative } from 'path';
import pc from 'picocolors';

/**
 * Log when HMR changes are fired
 */
export function hmrLogger(config: InternalConfig): Plugin {
  return {
    name: 'wxt:hmr-logger',
    apply: 'serve',
    handleHotUpdate(ctx) {
      if (
        ctx.file.startsWith(config.srcDir) &&
        !ctx.file.startsWith(config.wxtDir) &&
        !ctx.file.endsWith('.html')
      ) {
        config.logger.info(
          'Hot reload: ' + pc.dim(relative(process.cwd(), ctx.file)),
        );
      }
    },
  };
}
