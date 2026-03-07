/**
 * Parse environment variables from a string. Uses node:util parseEnv if
 * available (Node 22+), otherwise provides a polyfill.
 */

function parseEnvPolyfill(input: string): Record<string, string> {
  const result: Record<string, string> = {};

  const lines = input.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      continue;
    }

    const key = trimmed.substring(0, eqIndex).trim();
    let value = trimmed.substring(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

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

    if (key) {
      result[key] = value;
    }
  }

  return result;
}

let cachedParseEnv: ((input: string) => Record<string, string>) | null = null;

async function getParseEnv(): Promise<
  (input: string) => Record<string, string>
> {
  if (cachedParseEnv) {
    return cachedParseEnv;
  }

  try {
    const nodeVersion = parseInt(process.versions.node.split('.')[0], 10);
    if (nodeVersion >= 22) {
      const util = await import('node:util');
      if ('parseEnv' in util && typeof util.parseEnv === 'function') {
        cachedParseEnv = util.parseEnv as (
          input: string,
        ) => Record<string, string>;
        return cachedParseEnv;
      }
    }
  } catch {
    // Fallback to polyfill
  }

  cachedParseEnv = parseEnvPolyfill;
  return cachedParseEnv;
}

export async function parseEnv(input: string): Promise<Record<string, string>> {
  const impl = await getParseEnv();
  return impl(input);
}
