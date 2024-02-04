import * as vite from 'vite';
import { toArray } from '~/core/utils/arrays';
import { Entrypoint, EntrypointGroup } from '~/types';

/**
 * Generate esm content script loade
 */
export function esmContentScripts(group: EntrypointGroup): vite.Plugin {
  return {
    name: 'wxt:esm-content-scripts',
    generateBundle(_options, bundle, _isWrite) {
      toArray(group)
        .filter(
          (entrypoint) =>
            entrypoint.type === 'content-script' &&
            entrypoint.options.type === 'module',
        )
        .forEach((entrypoint) => {
          const name = `${entrypoint.name}-loader`;
          const fileName = `content-scripts/${name}.js`;
          bundle[fileName] = {
            type: 'asset',
            fileName,
            name,
            needsCodeReference: false,
            source: renderLoaderTemplate(entrypoint),
          };
        });
    },
  };
}

function renderLoaderTemplate(entrypoint: Entrypoint) {
  return `import(
  /* vite-ignore */
  chrome.runtime.getURL('/content-scripts/${entrypoint.name}.js')
)
`;
}
