import { Plugin } from 'vite';
import { addViteConfig, defineWxtModule } from '../modules';
import { Wxt } from '../types';

export default defineWxtModule({
  name: 'wxt:built-in:escape-unicode',
  setup(wxt) {
    if (!wxt.config.experimental.escapeUtf8) return;

    addViteConfig(wxt, () => ({
      plugins: [escapeUtf8Plugin(wxt)],
    }));
  },
});

function escapeUtf8Plugin(wxt: Wxt): Plugin {
  return {
    name: 'wxt:escape-unicode',
    generateBundle: (_, bundle) => {
      const start = Date.now();
      for (const key of Object.keys(bundle)) {
        const chunk = bundle[key];
        if (chunk.type === 'chunk') {
          chunk.code = escapeNonCharacterUnicode(chunk.code);
        }
      }
      const end = Date.now();
      wxt.logger.info('Escaped UTF8 non-characters in ' + (end - start) + 'ms');
    },
  };
}

/**
 * See:
 *
 * - https://github.com/rolldown/rolldown/issues/8805#issuecomment-4103480096
 * - https://github.com/rolldown/rolldown/issues/8805#issuecomment-5134001768
 */
function escapeNonCharacterUnicode(text: string): string {
  return text.replace(
    /[\uFDD0-\uFDEF\uFFFE\uFFFF]|[\u{1FFFE}\u{1FFFF}\u{2FFFE}\u{2FFFF}\u{3FFFE}\u{3FFFF}\u{4FFFE}\u{4FFFF}\u{5FFFE}\u{5FFFF}\u{6FFFE}\u{6FFFF}\u{7FFFE}\u{7FFFF}\u{8FFFE}\u{8FFFF}\u{9FFFE}\u{9FFFF}\u{AFFFE}\u{AFFFF}\u{BFFFE}\u{BFFFF}\u{CFFFE}\u{CFFFF}\u{DFFFE}\u{DFFFF}\u{EFFFE}\u{EFFFF}\u{FFFFE}\u{FFFFF}\u{10FFFE}\u{10FFFF}]/gu,
    (m) => '\\u' + m.codePointAt(0)!.toString(16),
  );
}
