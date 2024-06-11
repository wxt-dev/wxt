import { fakeWxt } from '~/core/utils/testing/fake-objects';
import { addViteConfig } from '../modules';
import { describe, it, expect } from 'vitest';
import { createHooks } from 'hookable';

describe('Module Utilities', () => {
  describe('addViteConfig', () => {
    it('should add base vite config', async () => {
      const wxt = fakeWxt({
        hooks: createHooks(),
      });
      const expected = { build: { sourcemap: true } };
      const userConfig = {};
      const moduleConfig = { build: { sourcemap: true } };

      wxt.config.vite = () => userConfig;
      addViteConfig(wxt, () => moduleConfig);
      await wxt.hooks.callHook('ready', wxt);
      const actual: any = wxt.config.vite(wxt.config.env);

      expect(actual).toEqual(expected);
    });

    it('should allow user config to override any changes made', async () => {
      const wxt = fakeWxt({
        hooks: createHooks(),
      });
      const expected = { build: { sourcemap: true, test: 2 } };
      const userConfig = { build: { sourcemap: true } };
      const moduleConfig = { build: { sourcemap: false, test: 2 } };

      wxt.config.vite = () => userConfig;
      addViteConfig(wxt, () => moduleConfig);
      await wxt.hooks.callHook('ready', wxt);
      const actual: any = wxt.config.vite(wxt.config.env);

      expect(actual).toEqual(expected);
    });
  });
});
