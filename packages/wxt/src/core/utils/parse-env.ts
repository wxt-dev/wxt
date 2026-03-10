import { createRequire } from 'node:module';

type ParseEnvFn = (input: string) => Record<string, string>;

const require = createRequire(import.meta.url);

function resolveParseEnv(): ParseEnvFn {
  try {
    const major = parseInt(process.versions.node.split('.')[0], 10);
    if (major >= 22) {
      const util = require('node:util') as Record<string, unknown>;
      if (typeof util.parseEnv === 'function') {
        return util.parseEnv as ParseEnvFn;
      }
    }
  } catch {
    // node:util unavailable or parseEnv missing — use polyfill
  }
  return parseEnvPolyfill;
}

function parseEnvPolyfill(input: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const line of input.split('\n')) {
    let entry = line.trim();
    if (!entry || entry.startsWith('#')) continue;

    // Strip `export ` prefix (e.g. `export FOO=bar` → `FOO=bar`)
    if (entry.startsWith('export ')) {
      entry = entry.substring(7);
    }

    const eqIndex = entry.indexOf('=');
    if (eqIndex === -1) continue;

    const key = entry.substring(0, eqIndex).trim();
    if (!key) continue;

    const rawValue = entry.substring(eqIndex + 1).trim();
    let value: string;

    if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
      // Double-quoted: strip quotes, unescape sequences
      value = rawValue
        .slice(1, -1)
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
    } else if (rawValue.startsWith("'") && rawValue.endsWith("'")) {
      // Single-quoted: strip quotes, no unescaping
      value = rawValue.slice(1, -1);
    } else {
      // Unquoted: strip inline comments (# and everything after)
      const hashIndex = rawValue.indexOf('#');
      value = hashIndex === -1 ? rawValue : rawValue.substring(0, hashIndex);
      value = value.trimEnd();
    }

    result[key] = value;
  }

  return result;
}

const parseEnvImpl = resolveParseEnv();

export function parseEnv(input: string): Record<string, string> {
  return parseEnvImpl(input);
}
