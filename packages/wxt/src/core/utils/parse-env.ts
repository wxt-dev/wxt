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
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.substring(0, eqIndex).trim();
    if (!key) continue;

    let value = trimmed.substring(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Unescape sequences inside double-quoted values
    if (
      trimmed
        .substring(eqIndex + 1)
        .trim()
        .startsWith('"')
    ) {
      value = value
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\')
        .replace(/\\"/g, '"');
    }

    result[key] = value;
  }

  return result;
}

const parseEnvImpl = resolveParseEnv();

export function parseEnv(input: string): Record<string, string> {
  return parseEnvImpl(input);
}
