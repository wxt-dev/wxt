import { describe, expect, it, beforeEach } from 'vitest';
import {
  hashContentScriptOptions,
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

  describe('mapWxtOptionsToRegisteredContentScript', () => {
    it('preserves matchOriginAsFallback for dynamic registration', () => {
      const contentScript = mapWxtOptionsToRegisteredContentScript(
        {
          matches: ['*://example.com/*'],
          matchOriginAsFallback: true,
          allFrames: true,
          runAt: 'document_start',
          world: 'MAIN',
        },
        ['content-scripts/example.js'],
        undefined,
      );

      expect(contentScript).toEqual({
        allFrames: true,
        excludeMatches: undefined,
        matchOriginAsFallback: true,
        matches: ['*://example.com/*'],
        runAt: 'document_start',
        js: ['content-scripts/example.js'],
        css: undefined,
        world: 'MAIN',
      });
    });

    it('preserves false matchOriginAsFallback values', () => {
      const contentScript = mapWxtOptionsToRegisteredContentScript(
        {
          matches: ['*://example.com/*'],
          matchOriginAsFallback: false,
        },
        ['content-scripts/example.js'],
        [],
      );

      expect(contentScript.matchOriginAsFallback).toBe(false);
    });
  });
});
