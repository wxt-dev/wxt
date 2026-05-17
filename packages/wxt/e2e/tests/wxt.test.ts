import { describe, expect, it } from 'vitest';
import { registerWxt, wxt } from '../../src/core/wxt';
import { TestProject, occupyPort } from '../utils';

describe('WXT Global', () => {
  describe('reloadConfig', () => {
    it('should not change dev server ports when reloading config, even if the port is in-use', async () => {
      const project = new TestProject();

      await registerWxt('serve', { root: project.root });

      const firstPort = wxt.config.dev.server!.port;
      expect(firstPort).toBeDefined();

      const cleanup = await occupyPort(firstPort);
      try {
        await wxt.reloadConfig();
        const secondPort = wxt.config.dev.server?.port;
        expect(secondPort).toBe(firstPort);
      } finally {
        cleanup();
      }
    });
  });
});
