// @ts-check
import { MarkdownPageEvent } from 'typedoc-plugin-markdown';
import { ReflectionKind } from 'typedoc';

// Same algorithm as typedoc-vitepress-theme's slugifyAnchor so TOC links resolve.
// eslint-disable-next-line no-control-regex
const rControl = /[\u0000-\u001f]/g;
const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g;
const rCombining = /[\u0300-\u036f]/g;

/** @param {string} str */
function slugifyAnchor(str) {
  return str
    .normalize('NFKD')
    .replace(rCombining, '')
    .replace(rControl, '')
    .replace(rSpecial, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase();
}

/** @param {string} heading */
function plainHeadingText(heading) {
  return heading
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*`_~]/g, '')
    .trim();
}

/**
 * Restore the in-page "## Contents" TOC from typedoc-plugin-markdown
 * 4.0.0-next.
 *
 * @param {import('typedoc-plugin-markdown').MarkdownApplication} app
 */
export function load(app) {
  app.renderer.on(MarkdownPageEvent.END, (page) => {
    if (!page.contents) return;
    if (/(?:^|\n)## Contents\n/.test(page.contents)) return;
    if (!page.isReflectionEvent()) return;

    const reflection = page.model;
    if (
      !reflection.kindOf([
        ReflectionKind.Project,
        ReflectionKind.Module,
        ReflectionKind.Namespace,
        ReflectionKind.Enum,
        ReflectionKind.Class,
        ReflectionKind.Interface,
      ])
    ) {
      return;
    }

    // TypeDoc 0.28 moved "own document" checks onto the router. Approximate the
    // old hasToc gate: only inject when the page has multiple in-page headings.
    const headingRe = /^(#{2,3})\s+(.+)$/gm;
    /** @type {{ level: number; text: string }[]} */
    const headings = [];
    for (const match of page.contents.matchAll(headingRe)) {
      headings.push({ level: match[1].length, text: match[2].trim() });
    }
    if (headings.length <= 2) return;

    /** @type {Map<string, number>} */
    const slugCounts = new Map();
    const toc = headings
      .map(({ level, text }) => {
        const plain = plainHeadingText(text);
        const base = slugifyAnchor(plain);
        const count = (slugCounts.get(base) ?? 0) + 1;
        slugCounts.set(base, count);
        const slug = count > 1 ? `${base}-${count - 1}` : base;
        const indent = '  '.repeat(Math.max(0, level - 2));
        return `${indent}- [${plain}](#${slug})`;
      })
      .join('\n');

    const lines = page.contents.split('\n');
    const firstHeadingIndex = lines.findIndex((line) => line.startsWith('## '));
    if (firstHeadingIndex < 1) return;

    lines.splice(firstHeadingIndex, 0, '', '## Contents', '', toc, '');
    page.contents = lines.join('\n');
  });
}
