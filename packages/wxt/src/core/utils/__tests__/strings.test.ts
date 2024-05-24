import { describe, expect, it } from 'vitest';
import {
  kebabCaseAlphanumeric,
  removeImportStatements,
  safeVarName,
} from '../strings';

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

  describe('safeVarName', () => {
    it.each([
      ['Hello world!', '_hello_world'],
      ['123', '_123'],
      ['abc-123', '_abc_123'],
      ['', '_'],
      [' ', '_'],
      ['_', '_'],
    ])(
      "should convert '%s' to '%s', which can be used for a variable name",
      (input, expected) => {
        const actual = safeVarName(input);
        expect(actual).toBe(expected);
      },
    );
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
import * as abc from "@/utils/github"
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
