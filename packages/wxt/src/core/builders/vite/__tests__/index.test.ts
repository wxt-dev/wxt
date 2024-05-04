import { describe, it, expect } from 'vitest';
import { createViteBuilder } from '../index';
import { fakeResolvedConfig } from '~/core/utils/testing/fake-objects';
import { createHooks } from 'hookable';

describe('Vite Builder', () => {
  describe('importEntrypoint', () => {
    it('should import entrypoints, removing runtime values (like the main function)', async () => {
      const {
        default: { main: _, ...expected },
      } = await import('./fixtures/module');
      const builder = await createViteBuilder(
        fakeResolvedConfig({ root: __dirname }),
        createHooks(),
      );
      const actual = await builder.importEntrypoint<{ default: any }>(
        './fixtures/module.ts',
      );
      expect(actual).toEqual(expected);
    });
  });
});
