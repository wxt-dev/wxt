import path from 'node:path';
import { escapePath } from 'tinyglobby';
import { defineWxtModule } from '../../modules';
import { normalizePath } from '../../internal-utils/path-utils';

export default defineWxtModule({
  name: 'wxt:built-in:auto-include-sources',
  setup(wxt) {
    if (!wxt.config.experimental.autoIncludeSources) return;

    const moduleIds = new Set<string>();
    wxt.hooks.hook('vite:build:extendConfig', (_, config) => {
      config.plugins ??= [];
      config.plugins.push({
        name: 'wxt:auto-include-sources',
        buildEnd() {
          for (const id of this.getModuleIds()) moduleIds.add(id);
        },
      });
    });

    wxt.hooks.hook('zip:sources:start', (wxt) => {
      const { root, publicDir, modulesDir, zip } = wxt.config;

      // Returns a glob relative to `zip.sourcesRoot`, or undefined when the
      // path is outside of it (zip tools skip `../` entries when extracting)
      const toGlob = (file: string, suffix = '') => {
        const relative = normalizePath(path.relative(zip.sourcesRoot, file));
        if (relative.startsWith('../') || path.isAbsolute(relative)) return;
        return path.posix.join(escapePath(relative), suffix);
      };

      const outside: string[] = [];
      const globs = [
        // Vite doesn't load the package.json, lockfile, or config files, so
        // include the top-level files, public directory, and local modules too
        toGlob(zip.sourcesRoot, '*'),
        toGlob(root, '*'),
        toGlob(publicDir, '**'),
        toGlob(modulesDir, '**'),
      ];
      for (const id of moduleIds) {
        // Remove queries like "?inline" and skip virtual modules
        const file = normalizePath(id.split('?')[0]);
        if (!path.isAbsolute(file) || file.includes('/node_modules/')) continue;

        const glob = toGlob(file);
        if (glob) globs.push(glob);
        else outside.push(file);
      }

      if (outside.length > 0) {
        wxt.logger.warn(
          'Some files used to build the extension are outside `zip.sourcesRoot` and were not added to the sources ZIP:\n' +
            outside.map((file) => `  - ${file}`).join('\n'),
        );
      }

      zip.includeSources = [
        ...new Set([...zip.includeSources, ...globs.filter((g) => g != null)]),
      ];
    });
  },
});
