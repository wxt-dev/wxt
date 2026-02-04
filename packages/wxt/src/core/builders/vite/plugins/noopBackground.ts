import { Plugin } from 'vite';
import { VIRTUAL_NOOP_BACKGROUND_MODULE_ID } from '../../../utils/constants';

/**
 * In dev mode, if there's not a background script listed, we need to add one so that the web socket
 * connection is setup and the extension reloads HTML pages and content scripts correctly.
 */
export function noopBackground(): Plugin {
  const VIRTUAL_MODULE_ID = VIRTUAL_NOOP_BACKGROUND_MODULE_ID;
  const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

  return {
    name: 'wxt:noop-background',
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID;
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return `import { defineBackground } from 'wxt/utils/define-background';\nexport default defineBackground(() => void 0)`;
      }
    },
  };
}
