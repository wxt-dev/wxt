import { describe, expect, it, beforeEach } from 'vitest';
import {
  getRegisteredMatches,
  stripPathFromMatchPattern,
  hashContentScriptOptions,
  mapWxtOptionsToContentScript,
  mapWxtOptionsToRegisteredContentScript,
} from '../content-scripts';
import { setFakeWxt } from '../testing/fake-objects';

describe('Content Script Utils', () => {
  beforeEach(() => {
    setFakeWxt();
  });

  describe('hashContentScriptOptions', () => {
    it('should return a string containing all the options with defaults applied', () => {
      const hash = hashContentScriptOptions({ matches: [] });

      expect(hash).toEqual(
        '[["all_frames",false],["exclude_globs",[]],["exclude_matches",[]],["include_globs",[]],["match_about_blank",false],["match_origin_as_fallback",false],["matches",[]],["run_at","document_idle"],["world","ISOLATED"]]',
      );
    });

    it('should be consistent regardless of the object ordering and default values', () => {
      const hash1 = hashContentScriptOptions({
        allFrames: true,
        matches: ['*://google.com/*', '*://duckduckgo.com/*'],
        matchAboutBlank: false,
      });
      const hash2 = hashContentScriptOptions({
        matches: ['*://duckduckgo.com/*', '*://google.com/*'],
        allFrames: true,
      });

      expect(hash1).toBe(hash2);
    });
  });

  describe('SPA content scripts', () => {
    it('should strip the path from matches so the browser loads the script for the whole origin', () => {
      const actual = getRegisteredMatches({
        matches: ['*://*.youtube.com/watch*', '*://*.youtube.com/playlist*'],
        spa: true,
      });

      expect(actual).toEqual(['*://*.youtube.com/*']);
    });

    it('should leave matches alone when `spa` is not enabled', () => {
      const matches = ['*://*.youtube.com/watch*'];

      expect(getRegisteredMatches({ matches })).toEqual(matches);
      expect(getRegisteredMatches({ matches, spa: false })).toEqual(matches);
    });

    it('should not strip patterns without a protocol separator', () => {
      const actual = getRegisteredMatches({
        matches: ['<all_urls>'],
        spa: true,
      });

      expect(actual).toEqual(['<all_urls>']);
    });

    it('should drop excludeMatches from the manifest so it can be applied at runtime', () => {
      const actual = mapWxtOptionsToContentScript(
        {
          matches: ['*://*.youtube.com/watch*'],
          excludeMatches: ['*://*.youtube.com/shorts/*'],
          spa: true,
        },
        undefined,
        undefined,
      );

      expect(actual.matches).toEqual(['*://*.youtube.com/*']);
      expect(actual.exclude_matches).toBeUndefined();
    });

    it('should apply the same transformations to runtime registered scripts', () => {
      const actual = mapWxtOptionsToRegisteredContentScript(
        {
          matches: ['*://*.youtube.com/watch*'],
          excludeMatches: ['*://*.youtube.com/shorts/*'],
          spa: true,
        },
        undefined,
        undefined,
      );

      expect(actual.matches).toEqual(['*://*.youtube.com/*']);
      expect(actual.excludeMatches).toBeUndefined();
    });

    it('should not merge SPA scripts on the same origin when their other options differ', () => {
      const hash1 = hashContentScriptOptions({
        matches: ['*://*.youtube.com/watch*'],
        spa: true,
        runAt: 'document_start',
      });
      const hash2 = hashContentScriptOptions({
        matches: ['*://*.youtube.com/playlist*'],
        spa: true,
        runAt: 'document_end',
      });

      expect(hash1).not.toBe(hash2);
    });

    it('should hash two SPA scripts on the same origin identically so they share a manifest entry', () => {
      const hash1 = hashContentScriptOptions({
        matches: ['*://*.youtube.com/watch*'],
        spa: true,
      });
      const hash2 = hashContentScriptOptions({
        matches: ['*://*.youtube.com/playlist*'],
        spa: true,
      });

      expect(hash1).toBe(hash2);
    });
  });

  describe('stripPathFromMatchPattern', () => {
    it.each([
      ['<all_urls>', '<all_urls>'],
      ['*://play.google.com/books/*', '*://play.google.com/*'],
      ['*://*/*', '*://*/*'],
      ['https://github.com/wxt-dev/*', 'https://github.com/*'],
    ])('should convert "%s" to "%s"', (input, expected) => {
      const actual = stripPathFromMatchPattern(input);
      expect(actual).toEqual(expected);
    });
  });
});
