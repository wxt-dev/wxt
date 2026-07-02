import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import type {
  Entrypoint,
  ResolvedPerBrowserOptions,
  BaseEntrypointOptions,
} from 'wxt';
import {
  refToConstName,
  getBundleExt,
  getRef,
  buildEntrypointsFile,
} from '../internal';

const ROOT = resolve('/wxt/.output/chrome-mv3');

function fakeEntrypoint(
  type: Entrypoint['type'],
  name: string,
  outputDir = ROOT,
  options: Partial<ResolvedPerBrowserOptions<BaseEntrypointOptions>> = {},
): Entrypoint {
  return {
    type,
    name,
    inputPath: `/wxt/entrypoints/${name}`,
    outputDir,
    options,
    skipped: false,
  } as unknown as Entrypoint;
}

describe('refToConstName', () => {
  it('handles simple names', () => {
    expect(refToConstName('popup')).toBe('ENTRYPOINT_POPUP');
    expect(refToConstName('background')).toBe('ENTRYPOINT_BACKGROUND');
    expect(refToConstName('newtab')).toBe('ENTRYPOINT_NEWTAB');
  });

  it('converts kebab-case to UPPER_SNAKE', () => {
    expect(refToConstName('my-content-script')).toBe(
      'ENTRYPOINT_MY_CONTENT_SCRIPT',
    );
  });

  it('handles already-uppercase input', () => {
    expect(refToConstName('POPUP')).toBe('ENTRYPOINT_POPUP');
  });

  it('strips leading/trailing separators', () => {
    expect(refToConstName('-popup-')).toBe('ENTRYPOINT_POPUP');
  });

  it('collapses consecutive separators', () => {
    expect(refToConstName('my--script')).toBe('ENTRYPOINT_MY_SCRIPT');
  });

  it('handles dots and underscores', () => {
    expect(refToConstName('my.script_v2')).toBe('ENTRYPOINT_MY_SCRIPT_V2');
  });
});

// ─── getBundleExt ───────────────────────────────────────────────────────────

describe('getBundleExt', () => {
  it.each([
    'popup',
    'options',
    'sidepanel',
    'newtab',
    'history',
    'bookmarks',
    'devtools',
    'sandbox',
    'unlisted-page',
  ] as const)('returns .html for %s', (type) => {
    expect(getBundleExt(fakeEntrypoint(type, 'x'))).toBe('.html');
  });

  it.each(['content-script-style', 'unlisted-style'] as const)(
    'returns .css for %s',
    (type) => {
      expect(getBundleExt(fakeEntrypoint(type, 'x'))).toBe('.css');
    },
  );

  it.each(['background', 'content-script', 'unlisted-script'] as const)(
    'returns .js for %s',
    (type) => {
      expect(getBundleExt(fakeEntrypoint(type, 'x'))).toBe('.js');
    },
  );
});

// ─── buildEntrypointsFile ───────────────────────────────────────────────────

describe('getRef', () => {
  it('falls back to the entrypoint name when no ref is set', () => {
    expect(getRef(fakeEntrypoint('popup', 'popup'))).toBe('popup');
  });

  it('uses options.ref when set', () => {
    expect(
      getRef(
        fakeEntrypoint('content-script', 'overlay', ROOT, { ref: 'OVERLAY' }),
      ),
    ).toBe('OVERLAY');
  });

  it('treats an empty-string ref as fallback to name (falsy-coerced)', () => {
    // || coerces empty string to falsy, so name is used instead.
    expect(
      getRef(fakeEntrypoint('content-script', 'overlay', ROOT, { ref: '' })),
    ).toBe('overlay');
  });
});

describe('buildEntrypointsFile', () => {
  it('emits one constant per entrypoint with the correct extension', () => {
    const entries: Entrypoint[] = [
      fakeEntrypoint('popup', 'popup'),
      fakeEntrypoint('background', 'background'),
      fakeEntrypoint(
        'content-script',
        'content',
        resolve(ROOT, 'content-scripts'),
      ),
    ];
    const out = buildEntrypointsFile(entries, ROOT);

    expect(out).toContain('export const ENTRYPOINT_POPUP = "popup.html";');
    expect(out).toContain(
      'export const ENTRYPOINT_BACKGROUND = "background.js";',
    );
    expect(out).toContain(
      'export const ENTRYPOINT_CONTENT = "content-scripts/content.js";',
    );
  });

  it('disambiguates collisions instead of overwriting', () => {
    const entries: Entrypoint[] = [
      fakeEntrypoint('content-script', 'my-script'),
      // Different filename, same UPPER_SNAKE form ("my_script" → "MY_SCRIPT")
      fakeEntrypoint('unlisted-script', 'my_script'),
    ];
    const out = buildEntrypointsFile(entries, ROOT);
    const exports = out.match(/export const \w+/g) ?? [];
    expect(exports).toHaveLength(2);
    expect(new Set(exports).size).toBe(2);
  });

  it('disambiguates same-type collisions with numeric suffixes', () => {
    const entries: Entrypoint[] = [
      fakeEntrypoint('content-script', 'foo'),
      // Same type, normalizes to same UPPER_SNAKE constant.
      fakeEntrypoint('content-script', 'FOO'),
      fakeEntrypoint('content-script', 'F-O-O'),
    ];
    const out = buildEntrypointsFile(entries, ROOT);
    const exports = out.match(/export const \w+/g) ?? [];
    expect(exports).toHaveLength(3);
    expect(new Set(exports).size).toBe(3);
  });

  it('uses options.ref when present', () => {
    const entries: Entrypoint[] = [
      fakeEntrypoint(
        'content-script',
        'overlay',
        resolve(ROOT, 'content-scripts'),
        {
          ref: 'OVERLAY',
        },
      ),
    ];
    const out = buildEntrypointsFile(entries, ROOT);
    expect(out).toContain(
      'export const ENTRYPOINT_OVERLAY = "content-scripts/overlay.js";',
    );
  });

  it('a custom ref survives a source-file rename', () => {
    const before = buildEntrypointsFile(
      [
        fakeEntrypoint(
          'content-script',
          'overlay',
          resolve(ROOT, 'content-scripts'),
          {
            ref: 'OVERLAY',
          },
        ),
      ],
      ROOT,
    );
    const after = buildEntrypointsFile(
      [
        fakeEntrypoint(
          'content-script',
          'badge',
          resolve(ROOT, 'content-scripts'),
          {
            ref: 'OVERLAY',
          },
        ),
      ],
      ROOT,
    );
    const beforeName = before.match(/ENTRYPOINT_\w+/)?.[0];
    const afterName = after.match(/ENTRYPOINT_\w+/)?.[0];
    expect(beforeName).toBe('ENTRYPOINT_OVERLAY');
    expect(afterName).toBe('ENTRYPOINT_OVERLAY');
  });

  it('emits a _CSS companion constant when content-script has a style sibling', () => {
    const entries: Entrypoint[] = [
      fakeEntrypoint(
        'content-script',
        'overlay',
        resolve(ROOT, 'content-scripts'),
      ),
      fakeEntrypoint(
        'content-script-style',
        'overlay',
        resolve(ROOT, 'content-scripts'),
      ),
    ];
    const out = buildEntrypointsFile(entries, ROOT);
    expect(out).toContain(
      'export const ENTRYPOINT_OVERLAY = "content-scripts/overlay.js";',
    );
    expect(out).toContain(
      'export const ENTRYPOINT_OVERLAY_CSS = "content-scripts/overlay.css";',
    );
  });

  it('CSS companion follows the content-script ref, not its filename', () => {
    const entries: Entrypoint[] = [
      fakeEntrypoint(
        'content-script',
        'overlay',
        resolve(ROOT, 'content-scripts'),
        { ref: 'CUSTOM' },
      ),
      fakeEntrypoint(
        'content-script-style',
        'overlay',
        resolve(ROOT, 'content-scripts'),
      ),
    ];
    const out = buildEntrypointsFile(entries, ROOT);
    expect(out).toContain(
      'export const ENTRYPOINT_CUSTOM = "content-scripts/overlay.js";',
    );
    expect(out).toContain(
      'export const ENTRYPOINT_CUSTOM_CSS = "content-scripts/overlay.css";',
    );
  });

  it('does not emit _CSS when content-script has no style sibling', () => {
    const entries: Entrypoint[] = [
      fakeEntrypoint(
        'content-script',
        'overlay',
        resolve(ROOT, 'content-scripts'),
      ),
    ];
    const out = buildEntrypointsFile(entries, ROOT);
    expect(out).not.toContain('CSS');
  });

  it('emits a .css constant for a standalone content-script-style entry', () => {
    const entries: Entrypoint[] = [
      fakeEntrypoint(
        'content-script-style',
        'theme',
        resolve(ROOT, 'content-scripts'),
      ),
    ];
    const out = buildEntrypointsFile(entries, ROOT);
    expect(out).toContain(
      'export const ENTRYPOINT_THEME = "content-scripts/theme.css";',
    );
  });

  it('returns a header-only file for an empty entrypoints array', () => {
    const out = buildEntrypointsFile([], ROOT);
    expect(out).toBe('// Generated by @wxt-dev/entrypoint-refs\n\n');
  });

  it('starts and ends with the expected markers', () => {
    const out = buildEntrypointsFile([fakeEntrypoint('popup', 'popup')], ROOT);
    expect(out.startsWith('// Generated by @wxt-dev/entrypoint-refs\n')).toBe(
      true,
    );
    expect(out.endsWith('\n')).toBe(true);
  });

  it('emits valid TypeScript (no unterminated strings, balanced lines)', () => {
    const entries: Entrypoint[] = [
      fakeEntrypoint('popup', 'popup'),
      fakeEntrypoint('options', 'options'),
      fakeEntrypoint('content-script-style', 'styles'),
    ];
    const out = buildEntrypointsFile(entries, ROOT);
    // Every export line should end with `;` and contain a quoted string.
    const exportLines = out
      .split('\n')
      .filter((l) => l.startsWith('export const'));
    expect(exportLines).toHaveLength(3);
    for (const line of exportLines) {
      expect(line).toMatch(/^export const \w+ = ".+";$/);
    }
  });
});
