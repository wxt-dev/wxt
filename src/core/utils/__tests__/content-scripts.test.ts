import { describe, expect, it } from 'vitest';
import { hashContentScriptOptions } from '../content-scripts';

describe('Content Script Utils', () => {
  describe('hashContentScriptOptions', () => {
    it('should return a string containing all the options with defaults applied', () => {
      const hash = hashContentScriptOptions({ matches: [] });

      expect(hash).toMatchInlineSnapshot(
        '"[[\\"allFrames\\",false],[\\"excludeGlobs\\",[]],[\\"excludeMatches\\",[]],[\\"includeGlobs\\",[]],[\\"matchAboutBlank\\",false],[\\"matches\\",[]],[\\"matchOriginAsFallback\\",false],[\\"runAt\\",\\"document_idle\\"],[\\"world\\",\\"ISOLATED\\"]]"',
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
