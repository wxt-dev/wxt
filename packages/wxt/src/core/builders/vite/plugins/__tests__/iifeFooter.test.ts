import { describe, expect, it } from 'vitest';
import { iifeFooter } from '../iifeFooter';

interface OutputChunk {
  type: 'chunk';
  code: string;
  isEntry: boolean;
}

interface OutputAsset {
  type: 'asset';
  source: string;
}

type OutputBundle = Record<string, OutputChunk | OutputAsset>;

function dedent(code: string) {
  const lines = code.trim().split('\n');
  return lines.map((line) => line.trimStart()).join('\n');
}

function createBundle(code: string): OutputBundle {
  return {
    'entry.js': {
      type: 'chunk',
      code: dedent(code),
      isEntry: true,
    },
  };
}

function getCode(bundle: OutputBundle): string {
  const entry = bundle['entry.js'];

  if (entry.type !== 'chunk') {
    throw new Error('expected chunk');
  }

  return entry.code;
}

function runPlugin(name: string, bundle: OutputBundle) {
  const plugin = iifeFooter(name);
  // @ts-expect-error -- calling the hook directly
  plugin.generateBundle(undefined, bundle);
}

describe('IIFE return value plugin', () => {
  it('should append return value when no sourcemap comment', () => {
    const bundle = createBundle(`
      var foo = (function(){return 1})();
    `);

    runPlugin('foo', bundle);

    expect(getCode(bundle)).toBe(
      dedent(`
        var foo = (function(){return 1})();
        foo;
      `),
    );
  });

  it('should insert return value before sourcemap comment', () => {
    const bundle = createBundle(`
      var foo = (function(){return 1})();
      //# ${'sourceMappingURL'}=foo.js.map
    `);

    runPlugin('foo', bundle);

    expect(getCode(bundle)).toBe(
      dedent(`
        var foo = (function(){return 1})();
        foo;
        //# ${'sourceMappingURL'}=foo.js.map
      `),
    );
  });

  it('should insert return value before inline sourcemap', () => {
    const bundle = createBundle(`
      var foo = (function(){return 1})();
      //# ${'sourceMappingURL'}=data:application/json;base64,abc123
    `);

    runPlugin('foo', bundle);

    expect(getCode(bundle)).toBe(
      dedent(`
        var foo = (function(){return 1})();
        foo;
        //# ${'sourceMappingURL'}=data:application/json;base64,abc123
      `),
    );
  });

  it('should skip non-entry chunks', () => {
    const bundle = createBundle('var x = 1;');
    (bundle['entry.js'] as OutputChunk).isEntry = false;

    runPlugin('x', bundle);

    expect(getCode(bundle)).toBe('var x = 1;');
  });

  it('should skip assets', () => {
    const bundle: OutputBundle = {
      'style.css': {
        type: 'asset',
        source: 'body {}',
      } satisfies OutputAsset,
    };

    runPlugin('style', bundle);

    expect((bundle['style.css'] as OutputAsset).source).toBe('body {}');
  });
});
