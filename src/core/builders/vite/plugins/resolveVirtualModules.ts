import { Plugin } from 'vite';
import { ResolvedConfig } from '~/types';
import { normalizePath } from '~/core/utils/paths';
import {
  VirtualModuleId,
  virtualModuleNames,
} from '~/core/utils/virtual-modules';
import fs from 'fs-extra';
import { resolve } from 'path';
import { getEntrypointName } from '~/core/utils/entrypoints';

/**
 * Resolve all the virtual modules to the `node_modules/wxt/dist/virtual` directory.
 */
export function resolveVirtualModules(config: ResolvedConfig): Plugin[] {
  return virtualModuleNames.map((name) => {
    const virtualId: `${VirtualModuleId}?` = `virtual:wxt-${name}?`;
    const resolvedVirtualId = '\0' + virtualId;
    return {
      name: `wxt:resolve-virtual-${name}`,
      resolveId(id) {
        // Id doesn't start with prefix, it looks like this:
        // /path/to/project/virtual:wxt-background?/path/to/project/entrypoints/background.ts
        const index = id.indexOf(virtualId);
        if (index === -1) return;

        const inputPath = normalizePath(id.substring(index + virtualId.length));
        return resolvedVirtualId + inputPath;
      },
      async load(id) {
        if (!id.startsWith(resolvedVirtualId)) return;

        const inputPath = id.replace(resolvedVirtualId, '');
        const entrypointName = getEntrypointName(
          config.entrypointsDir,
          inputPath,
        );
        if (!entrypointName)
          throw Error('Entrypoint name could not be detected: ' + inputPath);

        const template = await fs.readFile(
          resolve(config.wxtModuleDir, `dist/virtual/${name}.js`),
          'utf-8',
        );
        return template
          .replace(`virtual:user-${name}`, inputPath)
          .replaceAll('__ENTRYPOINT__', JSON.stringify(entrypointName))
          .replaceAll(
            '__ESM_CONTENT_SCRIPT_URL__',
            config.dev.server != null
              ? // Point to virtual entrypoint in dev server
                JSON.stringify(
                  `${
                    config.dev.server.origin
                  }/virtual:wxt-content-script-isolated-world?${normalizePath(
                    inputPath,
                  )}`,
                )
              : // Point to file in bundle
                `chrome.runtime.getURL('/content-scripts/${entrypointName}.js')`,
          );
      },
    };
  });
}
