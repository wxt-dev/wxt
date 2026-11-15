import { Parser } from 'htmlparser2';

interface SourceRange {
  start: number;
  /** Exclusive. */
  end: number;
}

export interface HtmlTag {
  name: string;
  attrs: Record<string, string>;
  /** Where each attribute is in the source, including its name and value. */
  attrRanges: Record<string, SourceRange>;
  /** Index of the `<` that opens the start tag. */
  start: number;
  /** Index right after the `>` that closes the start tag. */
  openEnd: number;
  /** Index of the `<` of the end tag, if the element has an explicit one. */
  closeStart?: number;
  /** Index right after the `>` of the end tag, if there is one. */
  closeEnd?: number;
  /** Decoded text content directly inside the element. */
  text: string;
}

/**
 * Find every element written in an HTML string, along with where it is in the
 * source, so the HTML can be edited by splicing instead of re-serializing it.
 * Elements the parser implied (like a missing `<head>`) aren't included.
 */
/**
 * Find every element written in an HTML string, along with where it is in the
 * source, so the HTML can be edited by splicing instead of re-serializing it.
 */
export function scanHtml(html: string): HtmlTag[] {
  const tags: HtmlTag[] = [];
  const stack: HtmlTag[] = [];
  const parser = new Parser({
    onopentag(name, attrs) {
      const start = parser.startIndex;
      const openEnd = parser.endIndex + 1;
      const tag: HtmlTag = {
        name,
        attrs,
        attrRanges: scanAttributeRanges(html, start, openEnd),
        start,
        openEnd,
        text: '',
      };
      tags.push(tag);
      stack.push(tag);
    },
    ontext(data) {
      const tag = stack[stack.length - 1];
      if (tag) tag.text += data;
    },
    onclosetag(name, implied) {
      const index = stack.map((tag) => tag.name).lastIndexOf(name);
      if (index < 0) return;
      const [tag] = stack.splice(index);
      if (!implied) {
        tag.closeStart = parser.startIndex;
        tag.closeEnd = parser.endIndex + 1;
      }
    },
  });
  parser.write(html);
  parser.end();
  return tags;
}

/**
 * Walk through a start tag attribute by attribute to find where each one is.
 * Done in order so a quoted value that looks like an attribute isn't mistaken
 * for one.
 */
function scanAttributeRanges(
  html: string,
  start: number,
  end: number,
): Record<string, SourceRange> {
  const ranges: Record<string, SourceRange> = {};
  const openTag = html.slice(start, end);
  const attr = /\s*([^\s"'<>/=]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?/y;
  attr.lastIndex = /^<[^\s/>]+/.exec(openTag)?.[0].length ?? 0;
  for (let match; (match = attr.exec(openTag));) {
    const matchStart =
      match.index + match[0].length - match[0].trimStart().length;
    ranges[match[1].toLowerCase()] = {
      start: start + matchStart,
      end: start + match.index + match[0].length,
    };
  }
  return ranges;
}

export interface HtmlEdit {
  start: number;
  end: number;
  text: string;
}

/** Apply edits to the original string. Edits must not overlap. */
export function applyHtmlEdits(html: string, edits: HtmlEdit[]): string {
  return [...edits]
    .sort((a, b) => b.start - a.start || b.end - a.end)
    .reduce(
      (result, edit) =>
        result.slice(0, edit.start) + edit.text + result.slice(edit.end),
      html,
    );
}

/** Create an edit that sets an attribute that already exists on a start tag. */
export function setAttributeEdit(
  tag: HtmlTag,
  name: string,
  value: string,
): HtmlEdit {
  const range = tag.attrRanges[name];
  if (!range) throw Error(`<${tag.name}> has no "${name}" attribute`);
  const escaped = value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  return { ...range, text: `${name}="${escaped}"` };
}

/** Create an edit that removes an attribute from a start tag. */
export function removeAttributeEdit(
  html: string,
  tag: HtmlTag,
  name: string,
): HtmlEdit[] {
  const range = tag.attrRanges[name];
  if (!range) return [];
  // Also remove the whitespace before the attribute
  let start = range.start;
  while (start > tag.start && /\s/.test(html[start - 1])) start--;
  return [{ start, end: range.end, text: '' }];
}

/**
 * Create an edit that inserts `text` at the start or end of `<head>`. If there
 * is no `<head>`, one is created.
 */
export function insertIntoHeadEdit(
  html: string,
  tags: HtmlTag[],
  text: string,
  position: 'start' | 'end',
): HtmlEdit {
  const head = tags.find((tag) => tag.name === 'head');
  if (head) {
    const index =
      position === 'start' ? head.openEnd : (head.closeStart ?? head.openEnd);
    return { start: index, end: index, text };
  }

  const root = tags.find((tag) => tag.name === 'html');
  const index = root
    ? root.openEnd
    : // Skip a leading doctype
      (/^\s*<!doctype[^>]*>/i.exec(html)?.[0].length ?? 0);
  return { start: index, end: index, text: `<head>${text}</head>` };
}
