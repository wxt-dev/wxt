import { describe, it, expect } from 'vitest';
import {
  fakeArray,
  fakeContentScriptEntrypoint,
  fakeEntrypoint,
  fakeGenericEntrypoint,
} from '../testing/fake-objects';
import { validateEntrypoints } from '../validation';

describe('Validation Utils', () => {
  describe('validateEntrypoints', () => {
    it('should return no errors when there are no errors', () => {
      const entrypoints = fakeArray(fakeEntrypoint);
      const expected = {
        errors: [],
        errorCount: 0,
        warningCount: 0,
      };

      const actual = validateEntrypoints(entrypoints);

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

      const actual = validateEntrypoints([entrypoint]);

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

      const actual = validateEntrypoints([entrypoint]);

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

      const actual = validateEntrypoints([entrypoint]);

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

      const actual = validateEntrypoints([entrypoint]);

      expect(actual).toEqual(expected);
    });
  });
});
