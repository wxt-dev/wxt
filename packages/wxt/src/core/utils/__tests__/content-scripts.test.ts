import { describe, expect, it, beforeEach } from 'vitest';
import { hashContentScriptOptions } from '../content-scripts';
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
});
