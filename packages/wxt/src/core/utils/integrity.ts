import { createHash } from 'node:crypto';

export const HASH_ALGORITHMS = ['sha256', 'sha384', 'sha512'] as const;

export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];

export interface UrlImport {
  url: string;
  /** `undefined` when the import was written without an integrity hash. */
  integrity: string | undefined;
}

const URL_IMPORT_RE = /^url(?:#([^:]*))?:(.*)$/s;

const INTEGRITY_RE = /^([a-z0-9]+)-(.+)$/i;

/**
 * Parses an import specifier like
 * `url#sha256-abc123...:https://example.com/x.js` into its URL and integrity
 * hash. Returns `undefined` if the specifier isn't a URL import.
 */
export function parseUrlImport(id: string): UrlImport | undefined {
  const match = URL_IMPORT_RE.exec(id);
  if (!match) return;

  const [, integrity, url] = match;
  if (!url) return;

  return { url, integrity: integrity || undefined };
}

/**
 * Hashes content the same way {@link verifyIntegrity} does, returning a value
 * usable as an integrity hash. Hashes are computed over the UTF-8 bytes of the
 * file, so they match `shasum -a 256 <file>` for UTF-8 sources.
 */
export function hashContent(
  content: string,
  algorithm: HashAlgorithm = 'sha256',
): string {
  const digest = createHash(algorithm).update(content, 'utf8').digest();
  return `${algorithm}-${digest.toString('base64')}`;
}

/**
 * Throws unless `content` matches `integrity`. Accepts both base64 (the
 * [Subresource
 * Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
 * format used by CDNs) and hex digests.
 */
export function verifyIntegrity(
  content: string,
  integrity: string,
  url: string,
): void {
  const match = INTEGRITY_RE.exec(integrity);
  if (!match) {
    throw Error(
      `Invalid integrity hash "${integrity}" for "${url}". Expected "<algorithm>-<hash>", like "${hashContent(content)}".`,
    );
  }

  const [, algorithm, expected] = match;
  if (!isSupportedAlgorithm(algorithm)) {
    throw Error(
      `Unsupported hash algorithm "${algorithm}" for "${url}". Supported algorithms: ${HASH_ALGORITHMS.join(', ')}.`,
    );
  }

  const digest = createHash(algorithm).update(content, 'utf8').digest();
  const matches =
    digest.toString('base64') === expected ||
    digest.toString('hex').toLowerCase() === expected.toLowerCase();

  if (!matches) {
    const encoding = isHex(expected) ? 'hex' : 'base64';
    throw Error(
      `Integrity check failed for "${url}".\n\n` +
        `  Expected: ${algorithm}-${expected}\n` +
        `  Received: ${algorithm}-${digest.toString(encoding)}\n\n` +
        `The remote file changed since you added it. Review the new file, and if you trust it, update the hash in your import.`,
    );
  }
}

function isHex(hash: string): boolean {
  return hash.length % 2 === 0 && /^[0-9a-f]+$/i.test(hash);
}

function isSupportedAlgorithm(algorithm: string): algorithm is HashAlgorithm {
  return HASH_ALGORITHMS.includes(algorithm as HashAlgorithm);
}
