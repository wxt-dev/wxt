import { describe, expect, it } from 'vitest';

import {
  applyHtmlEdits,
  insertIntoHeadEdit,
  removeAttributeEdit,
  scanHtml,
  setAttributeEdit,
} from '../html-utils';

describe('HTML Utils', () => {
  describe('scanHtml', () => {
    it('should ignore tags inside comments', () => {
      const tags = scanHtml(
        '<!-- <meta name="a" content="b"> --><meta name="c">',
      );
      expect(tags.map((tag) => tag.attrs.name)).toEqual(['c']);
    });

    it('should handle ">" inside quoted attributes', () => {
      const [meta] = scanHtml('<meta name="a" content="1 > 0"><p>');
      expect(meta.attrs.content).toBe('1 > 0');
    });

    it('should not parse tags inside script content', () => {
      const html = '<script>const a = "<meta name=x>"</script><meta name="y">';
      const tags = scanHtml(html);
      expect(tags.map((tag) => tag.name)).toEqual(['script', 'meta']);
      expect(tags[0].text).toBe('const a = "<meta name=x>"');
      expect(html.slice(tags[0].start, tags[0].closeEnd)).toBe(
        '<script>const a = "<meta name=x>"</script>',
      );
    });
  });

  describe('edits', () => {
    it('should only change the targeted attribute and keep the rest as-is', () => {
      const html =
        '<p>hi</p>\n<script   type=module  src=./a.ts defer></script>';
      const script = scanHtml(html).find((tag) => tag.name === 'script')!;
      expect(
        applyHtmlEdits(html, [
          setAttributeEdit(script, 'src', 'http://x/a.ts'),
        ]),
      ).toBe(
        '<p>hi</p>\n<script   type=module  src="http://x/a.ts" defer></script>',
      );
    });

    it('should remove an attribute', () => {
      const html = '<link rel="stylesheet" wxt-ignore href="a.css">';
      const link = scanHtml(html)[0];
      expect(
        applyHtmlEdits(html, removeAttributeEdit(html, link, 'wxt-ignore')),
      ).toBe('<link rel="stylesheet" href="a.css">');
    });

    it.each([
      [
        '<html><head><title>a</title></head></html>',
        '<html><head>X<title>a</title></head></html>',
      ],
      [
        '<html><body></body></html>',
        '<html><head>X</head><body></body></html>',
      ],
      ['<!doctype html><p>hi</p>', '<!doctype html><head>X</head><p>hi</p>'],
    ])('should insert into the start of head of %s', (html, expected) => {
      const edit = insertIntoHeadEdit(html, scanHtml(html), 'X', 'start');
      expect(applyHtmlEdits(html, [edit])).toBe(expected);
    });

    it('should insert at the end of head', () => {
      const html = '<head><title>a</title></head>';
      const edit = insertIntoHeadEdit(html, scanHtml(html), 'X', 'end');
      expect(applyHtmlEdits(html, [edit])).toBe(
        '<head><title>a</title>X</head>',
      );
    });
  });
});
