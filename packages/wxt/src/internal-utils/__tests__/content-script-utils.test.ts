import { describe, expect, it, beforeEach } from 'vitest';
import {
  hashContentScriptOptions,
  mapWxtOptionsToRegisteredContentScript,
} from '../content-script-utils';
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
        matches: ['*://google.com/*', '*://example.com/*'],
        matchAboutBlank: false,
      });
      const hash2 = hashContentScriptOptions({
        matches: ['*://example.com/*', '*://google.com/*'],
        allFrames: true,
      });

      expect(hash1).toBe(hash2);
    });
  });

  describe('mapWxtOptionsToRegisteredContentScript', () => {
    it('should pass every supported option through to the registration', () => {
      const registered = mapWxtOptionsToRegisteredContentScript(
        {
          matches: ['*://example.com/*'],
          excludeMatches: ['*://example.com/ignore/*'],
          allFrames: true,
          runAt: 'document_start',
          matchOriginAsFallback: true,
          world: 'MAIN',
          // Manifest-only options, not accepted by registerContentScripts
          matchAboutBlank: true,
          includeGlobs: ['*example*'],
          excludeGlobs: ['*ignore*'],
        },
        ['content-scripts/example.js'],
        ['content-scripts/example.css'],
      );

      expect(registered).toEqual({
        matches: ['*://example.com/*'],
        excludeMatches: ['*://example.com/ignore/*'],
        allFrames: true,
        runAt: 'document_start',
        matchOriginAsFallback: true,
        world: 'MAIN',
        js: ['content-scripts/example.js'],
        css: ['content-scripts/example.css'],
      });
      expect(registered).not.toHaveProperty('matchAboutBlank');
      expect(registered).not.toHaveProperty('includeGlobs');
      expect(registered).not.toHaveProperty('excludeGlobs');
    });

    it('should preserve matchOriginAsFallback when set to false', () => {
      const registered = mapWxtOptionsToRegisteredContentScript(
        { matches: ['*://example.com/*'], matchOriginAsFallback: false },
        ['content-scripts/example.js'],
        undefined,
      );

      expect(registered.matchOriginAsFallback).toBe(false);
    });

    it('should leave matchOriginAsFallback undefined when not set', () => {
      const registered = mapWxtOptionsToRegisteredContentScript(
        { matches: ['*://example.com/*'] },
        ['content-scripts/example.js'],
        undefined,
      );

      expect(registered.matchOriginAsFallback).toBeUndefined();
    });
  });
});
