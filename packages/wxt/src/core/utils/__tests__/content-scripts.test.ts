import { describe, expect, it, beforeEach } from 'vitest';
import {
  getContentScriptDomainMatches,
  hashContentScriptOptions,
  mapWxtOptionsToContentScript,
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

  describe('getContentScriptDomainMatches', () => {
    it('should strip path patterns so SPA content scripts can run on same-origin navigations', () => {
      expect(
        getContentScriptDomainMatches([
          '*://*.youtube.com/watch*',
          '*://*.youtube.com/shorts/*',
          'https://example.com/admin/*',
          '<all_urls>',
          'file:///*',
        ]),
      ).toEqual([
        '*://*.youtube.com/*',
        'https://example.com/*',
        '<all_urls>',
        'file:///*',
      ]);
    });
  });

  describe('mapWxtOptionsToContentScript', () => {
    it('should use domain-level matches for SPA content scripts', () => {
      const actual = mapWxtOptionsToContentScript(
        {
          matches: ['*://*.youtube.com/watch*'],
          spa: true,
        },
        ['content-scripts/content.js'],
        undefined,
      );

      expect(actual.matches).toEqual(['*://*.youtube.com/*']);
    });
  });
});
