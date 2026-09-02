import { describe, expect, it } from 'vitest';
import { unimportPlugin } from '../unimport';
import type { WxtResolvedUnimportOptions } from '../../types';

const options = (): WxtResolvedUnimportOptions => ({
  disabled: false,
  eslintrc: { enabled: false, filePath: '', globalsPropValue: true },
  presets: [{ from: 'wxt/browser', imports: ['browser'] }],
});

const transform = (
  plugin: ReturnType<typeof unimportPlugin>,
  code: string,
  id: string,
) => {
  const transform = plugin.transform;
  const handler =
    typeof transform === 'function' ? transform : transform!.handler;
  return handler.call({} as any, code, id) as Promise<
    { code: string; map: { mappings: string; sources: string[] } } | undefined
  >;
};

/**
 * Sourcemap `mappings` are grouped by generated line (`;`), then by segment
 * (`,`). A line-level sourcemap only has one segment per line, so counting
 * segments tells us whether column information was included.
 */
const segmentsPerLine = (mappings: string) =>
  mappings.split(';').map((line) => (line === '' ? 0 : line.split(',').length));

describe('Unimport Module', () => {
  describe('unimportPlugin', () => {
    const id = '/src/utils/example.ts';
    const code = [
      'export function getExtensionId() {',
      '  const id = browser.runtime.id;',
      '  return id.toUpperCase();',
      '}',
      '',
    ].join('\n');

    it('should inject auto-imports', async () => {
      const res = await transform(unimportPlugin(options()), code, id);

      expect(res?.code).toContain("import { browser } from 'wxt/browser';");
      expect(res?.code).toContain('browser.runtime.id');
    });

    it('should generate a sourcemap with column-level mappings', async () => {
      const res = await transform(unimportPlugin(options()), code, id);

      // Without `hires`, every line collapses to a single segment, which makes
      // coverage tools treat the entire module as one statement.
      // See https://github.com/wxt-dev/wxt/issues/2604
      expect(Math.max(...segmentsPerLine(res!.map.mappings))).toBeGreaterThan(
        1,
      );
    });

    it('should include the module ID as the sourcemap source', async () => {
      const res = await transform(unimportPlugin(options()), code, id);

      expect(res!.map.sources).toEqual([id]);
    });

    it('should not transform files that do not use auto-imports', async () => {
      const res = await transform(
        unimportPlugin(options()),
        'export const one = 1;\n',
        id,
      );

      expect(res).toBeUndefined();
    });

    it('should not transform excluded files', async () => {
      const res = await transform(
        unimportPlugin(options()),
        code,
        '/node_modules/example/index.js',
      );

      expect(res).toBeUndefined();
    });

    it('should not transform non-JS files', async () => {
      const res = await transform(
        unimportPlugin(options()),
        code,
        '/src/a.css',
      );

      expect(res).toBeUndefined();
    });
  });
});
