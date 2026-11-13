export type TokenClass = 'kw' | 'st' | 'fn' | 'cm' | 'pn';
export interface Token {
  text: string;
  cls?: TokenClass;
}

const KEYWORDS = /^(export|default|import|from|const|let|return|await|async)$/;

// Just enough highlighting for the TS, HTML, and JSON snippets on the homepage.
const TOKEN_REGEX =
  /(?<cm>\/\/.*$)|(?<tag><\/?[A-Za-z!][\w!-]*)|(?<key>"[^"]*"(?=\s*:))|(?<st>'[^']*'|"[^"]*")|(?<attr>[A-Za-z_:][\w:.-]*(?==))|(?<fn>[A-Za-z_$][\w$]*(?=\())|(?<id>[A-Za-z_$][\w$]*)|(?<ws>\s+)|(?<pn>.)/g;

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  for (const match of line.matchAll(TOKEN_REGEX)) {
    const g = match.groups!;
    const text = match[0];
    if (g.cm) tokens.push({ text, cls: 'cm' });
    else if (g.tag) tokens.push({ text, cls: 'kw' });
    else if (g.key || g.attr || g.fn) tokens.push({ text, cls: 'fn' });
    else if (g.st) tokens.push({ text, cls: 'st' });
    else if (g.id)
      tokens.push({ text, cls: KEYWORDS.test(text) ? 'kw' : undefined });
    else if (g.ws) tokens.push({ text });
    else tokens.push({ text, cls: 'pn' });
  }
  return tokens;
}

export function highlight(source: string): Token[][] {
  return source.split('\n').map(tokenizeLine);
}
