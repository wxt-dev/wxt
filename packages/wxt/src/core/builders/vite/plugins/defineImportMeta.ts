/**
 * Overrides definitions for `import.meta.*`
 *
 * - `import.meta.url`: Without this, background service workers crash trying to access
 *   `document.location`, see https://github.com/wxt-dev/wxt/issues/392
 */
export function defineImportMeta() {
  return {
    name: 'wxt:define',
    config() {
      return {
        define: {
          // This works for all extension contexts, including background service worker
          'import.meta.url': 'self.location.href',
        },
      };
    },
  };
}
