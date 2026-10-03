import { describe, expect, it } from 'vitest';
import { getPluginModules } from '../wxtPluginLoader';
import {
  fakeBackgroundEntrypoint,
  fakeContentScriptEntrypoint,
} from '../../../../utils/testing/fake-objects';
import type { WxtPluginEntry } from '../../../../../types';

describe('Plugin Loader', () => {
  describe('getPluginModules', () => {
    const background = fakeBackgroundEntrypoint();
    const contentScript = fakeContentScriptEntrypoint();

    it('includes plugins without an apply function', () => {
      const plugins: WxtPluginEntry[] = [{ module: 'a' }];
      expect(getPluginModules(plugins, background)).toEqual(['a']);
    });

    it('includes only plugins whose apply function returns true', () => {
      const plugins: WxtPluginEntry[] = [
        { module: 'a', apply: (entry) => entry.type === 'background' },
        { module: 'b', apply: (entry) => entry.type === 'content-script' },
      ];
      expect(getPluginModules(plugins, background)).toEqual(['a']);
      expect(getPluginModules(plugins, contentScript)).toEqual(['b']);
    });

    it('includes every plugin when the entrypoint is unresolved', () => {
      const plugins: WxtPluginEntry[] = [
        { module: 'a', apply: () => false },
        { module: 'b' },
      ];
      expect(getPluginModules(plugins, undefined)).toEqual(['a', 'b']);
    });
  });
});
