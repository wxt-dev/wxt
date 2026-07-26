import { describe, expect, it } from 'vitest';
import { hashContent, parseUrlImport, verifyIntegrity } from '../integrity';

const url = 'https://example.com/script.js';
const content = 'console.log("hello");';
// sha256 of `content`
const base64 = 'sha256-N4H5TqgSuzNDfekEngS8OvQaDnOXFksFc3nAjDsKxIk=';
const hex =
  'sha256-3781f94ea812bb33437de9049e04bc3af41a0e7397164b057379c08c3b0ac489';

describe('Integrity utils', () => {
  describe('parseUrlImport', () => {
    it('should parse an import with an integrity hash', () => {
      expect(parseUrlImport(`url#${base64}:${url}`)).toEqual({
        url,
        integrity: base64,
      });
    });

    it.each([`url:${url}`, `url#:${url}`])(
      'should parse "%s" as an import without an integrity hash',
      (id) => {
        expect(parseUrlImport(id)).toEqual({ url, integrity: undefined });
      },
    );

    it('should keep query params and ports in the URL', () => {
      const complex = 'https://example.com:8443/gtag/js?id=G-XYZ&foo=a:b';
      expect(parseUrlImport(`url#${base64}:${complex}`)).toEqual({
        url: complex,
        integrity: base64,
      });
    });

    it.each(['url', 'url#', 'url:', 'other:https://a.com'])(
      'should return undefined for invalid specifier "%s"',
      (id) => {
        expect(parseUrlImport(id)).toBeUndefined();
      },
    );
  });

  describe('hashContent', () => {
    it('should return a base64 SRI hash', () => {
      expect(hashContent(content)).toBe(base64);
    });

    it('should support other algorithms', () => {
      expect(hashContent(content, 'sha512')).toMatch(/^sha512-/);
    });
  });

  describe('verifyIntegrity', () => {
    it('should pass for a matching base64 hash', () => {
      expect(() => verifyIntegrity(content, base64, url)).not.toThrow();
    });

    it('should pass for a matching hex hash', () => {
      expect(() => verifyIntegrity(content, hex, url)).not.toThrow();
    });

    it('should pass for a matching uppercase hex hash', () => {
      expect(() =>
        verifyIntegrity(
          content,
          hex.toUpperCase().replace('SHA256', 'sha256'),
          url,
        ),
      ).not.toThrow();
    });

    it('should throw when the content does not match', () => {
      expect(() => verifyIntegrity('console.log("bye");', base64, url)).toThrow(
        /Integrity check failed/,
      );
    });

    it('should include the expected and received hashes in the error', () => {
      expect(() => verifyIntegrity('changed', base64, url)).toThrow(
        new RegExp(`Expected: ${base64.replace(/[+/=]/g, '\\$&')}`),
      );
      expect(() => verifyIntegrity('changed', base64, url)).toThrow(
        new RegExp(
          `Received: ${hashContent('changed').replace(/[+/=]/g, '\\$&')}`,
        ),
      );
    });

    it('should report the received hash in the same encoding as the expected hash', () => {
      expect(() => verifyIntegrity('changed', hex, url)).toThrow(
        /Received: sha256-[0-9a-f]{64}\b/,
      );
      expect(() => verifyIntegrity('changed', base64, url)).toThrow(
        /Received: sha256-[A-Za-z0-9+/]+=*\n/,
      );
    });

    it('should throw for a hash with no algorithm', () => {
      expect(() => verifyIntegrity(content, 'nodashes', url)).toThrow(
        /Invalid integrity hash/,
      );
    });

    it('should throw for an unsupported algorithm', () => {
      expect(() => verifyIntegrity(content, 'md5-abc123', url)).toThrow(
        /Unsupported hash algorithm "md5"/,
      );
    });
  });
});
