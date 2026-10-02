import { describe, it, expect } from 'vitest';
import {
  fakeArray,
  fakeContentScriptEntrypoint,
  fakeEntrypoint,
  fakeGenericEntrypoint,
} from '../testing/fake-objects';
import { validateEntrypoints } from '../validation';

const noExperiments = {
  experimental: { escapeUnicode: false, spaContentScripts: false },
};
const spaEnabled = {
  experimental: { escapeUnicode: false, spaContentScripts: true },
};

describe('Validation Utils', () => {
  describe('validateEntrypoints', () => {
    it('should return no errors when there are no errors', () => {
      const entrypoints = fakeArray(fakeEntrypoint);
      const expected = {
        errors: [],
        errorCount: 0,
        warningCount: 0,
      };

      const actual = validateEntrypoints(entrypoints, noExperiments);

      expect(actual).toEqual(expected);
    });

    it('should return an error when exclude is not an array', () => {
      const entrypoint = fakeGenericEntrypoint({
        options: {
          // @ts-expect-error
          exclude: 0,
        },
      });
      const expected = {
        errors: [
          {
            type: 'error',
            message: '`exclude` must be an array of browser names',
            value: 0,
            entrypoint,
          },
        ],
        errorCount: 1,
        warningCount: 0,
      };

      const actual = validateEntrypoints([entrypoint], noExperiments);

      expect(actual).toEqual(expected);
    });

    it('should return an error when include is not an array', () => {
      const entrypoint = fakeGenericEntrypoint({
        options: {
          // @ts-expect-error
          include: 0,
        },
      });
      const expected = {
        errors: [
          {
            type: 'error',
            message: '`include` must be an array of browser names',
            value: 0,
            entrypoint,
          },
        ],
        errorCount: 1,
        warningCount: 0,
      };

      const actual = validateEntrypoints([entrypoint], noExperiments);

      expect(actual).toEqual(expected);
    });

    it('should return an error when "registration: manifest" content scripts don\'t have matches', () => {
      const entrypoint = fakeContentScriptEntrypoint({
        options: {
          registration: 'manifest',
          // @ts-expect-error
          matches: null,
        },
      });
      const expected = {
        errors: [
          {
            type: 'error',
            message:
              '`matches` is required for manifest registered content scripts',
            value: null,
            entrypoint,
          },
        ],
        errorCount: 1,
        warningCount: 0,
      };

      const actual = validateEntrypoints([entrypoint], noExperiments);

      expect(actual).toEqual(expected);
    });

    it('should allow "registration: runtime" content scripts to not have matches', () => {
      const entrypoint = fakeContentScriptEntrypoint({
        options: {
          registration: 'runtime',
          // @ts-expect-error
          matches: null,
        },
      });
      const expected = {
        errors: [],
        errorCount: 0,
        warningCount: 0,
      };

      const actual = validateEntrypoints([entrypoint], noExperiments);

      expect(actual).toEqual(expected);
    });

    describe('spa', () => {
      it('should return an error when `spa` is used without the experimental flag', () => {
        const entrypoint = fakeContentScriptEntrypoint({
          options: { matches: ['*://*.youtube.com/watch*'], spa: true },
        });

        const actual = validateEntrypoints([entrypoint], noExperiments);

        expect(actual.errorCount).toBe(1);
        expect(actual.errors[0].message).toMatch(
          'Set `experimental: { spaContentScripts: true }`',
        );
      });

      it('should return no errors when the experimental flag is enabled', () => {
        const entrypoint = fakeContentScriptEntrypoint({
          options: { matches: ['*://*.youtube.com/watch*'], spa: true },
        });

        const actual = validateEntrypoints([entrypoint], spaEnabled);

        expect(actual.errors).toEqual([]);
      });

      it('should return an error when combined with `world: "MAIN"`', () => {
        const entrypoint = fakeContentScriptEntrypoint({
          options: {
            matches: ['*://*.youtube.com/watch*'],
            world: 'MAIN',
            spa: true,
          },
        });

        const actual = validateEntrypoints([entrypoint], spaEnabled);

        expect(actual.errorCount).toBe(1);
        expect(actual.errors[0].message).toMatch('world: "MAIN"');
      });

      it.each(['includeGlobs', 'excludeGlobs'] as const)(
        'should return an error when combined with `%s`',
        (key) => {
          const entrypoint = fakeContentScriptEntrypoint({
            options: {
              matches: ['*://*.youtube.com/watch*'],
              spa: true,
              [key]: ['*watch*'],
            },
          });

          const actual = validateEntrypoints([entrypoint], spaEnabled);

          expect(actual.errorCount).toBe(1);
          expect(actual.errors[0].message).toMatch(key);
        },
      );

      it('should return an error when `matches` is missing, even for runtime registration', () => {
        const entrypoint = fakeContentScriptEntrypoint({
          options: {
            registration: 'runtime',
            // @ts-expect-error: Testing a missing value
            matches: null,
            spa: true,
          },
        });

        const actual = validateEntrypoints([entrypoint], spaEnabled);

        expect(actual.errorCount).toBe(1);
        expect(actual.errors[0].message).toMatch(
          '`matches` is required for `spa` content scripts',
        );
      });
    });
  });
});
