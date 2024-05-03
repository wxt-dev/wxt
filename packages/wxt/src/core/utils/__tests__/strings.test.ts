import { describe, expect, it } from 'vitest';
import {
  kebabCaseAlphanumeric,
  removeImportStatements,
} from '~/core/utils/strings';

describe('String utils', () => {
  describe('kebabCaseAlphanumeric', () => {
    it.each([
      ['HELLO', 'hello'],
      ['Hello, World!', 'hello-world'],
      ['hello123', 'hello123'],
      ['Hello World This Is A Test', 'hello-world-this-is-a-test'],
      ['Hello     World', 'hello-world'],
      ['hello-world', 'hello-world'], // Ensure hyphens are preserved
    ])('should convert "%s" to "%s"', (input, expected) => {
      expect(kebabCaseAlphanumeric(input)).toBe(expected);
    });
  });

  describe('removeImportStatements', () => {
    it('should remove all import formats', () => {
      const imports = `
import { registerGithubService, createGithubApi } from "@/utils/github";
import {
  registerGithubService,
  createGithubApi
} from "@/utils/github";
import{ registerGithubService, createGithubApi }from "@/utils/github";
import GitHub from "@/utils/github";
import "@/utils/github";
import '@/utils/github';
import"@/utils/github"
 import'@/utils/github';
    `;
      expect(removeImportStatements(imports).trim()).toEqual('');
    });

    it('should not remove import.meta or inline import statements', () => {
      const imports = `
import.meta.env.DEV
const a = await import("example");
import("example");
    `;
      expect(removeImportStatements(imports)).toEqual(imports);
    });
  });
});
