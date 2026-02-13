import type { Plugin } from 'vite';

/**
 * Remove the `var name = ` prefix from the generated code so it becomes an anonymous IIFE.
 * Handle both minified and non-minified cases.
 */
export function iifeAnonymous(iifeReturnValueName: string): Plugin {
  return {
    name: 'wxt:iife-anonymous',
    generateBundle(_, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type === 'chunk' && chunk.isEntry) {
          const namedIIFEPrefix = new RegExp(
            `^var ${iifeReturnValueName}\\s*=\\s*(\\(function)`,
          );
          chunk.code = chunk.code.replace(namedIIFEPrefix, '$1');
        }
      }
    },
  };
}
