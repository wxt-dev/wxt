import { describe, it, vi, expect, expectTypeOf } from 'vitest';
import { createExtensionI18n } from '../client';
import { fakeBrowser } from '@webext-core/fake-browser';

let getMessageMock = vi.fn();
fakeBrowser.i18n.getMessage = getMessageMock;

describe('createExtensionI18n', () => {
  describe('t', () => {
    it('should return the text from browsesr.i18n.getMessage', () => {
      const expected = 'Hello world';
      const i18n = createExtensionI18n();
      getMessageMock.mockReturnValue(expected);

      const actual = i18n.t('key', ['']);

      expect(actual).toBe(expected);
    });

    it("should return a blank string when the message doesn't exist", () => {
      const i18n = createExtensionI18n();
      // browser.i18n.getMessage returns a blank string when the message doesn't exist
      getMessageMock.mockReturnValue('');

      const actual = i18n.t('unknown-key');

      expect(actual).toBe('');
    });

    it('should pass substitutions in correctly', () => {
      const i18n = createExtensionI18n();
      const key = 'key';
      const subs = ['1', 'two'];

      i18n.t(key, subs);

      expect(getMessageMock).toBeCalledWith(key, subs);
    });
  });

  describe('tp', () => {
    it.each([
      [0, '0 items'],
      [1, '1 items'],
      [2, '2 items'],
      [3, '3 items'],
    ])(
      'should return the correct string for format "{n}" and count=%s',
      (count, expected) => {
        const i18n = createExtensionI18n();
        getMessageMock.mockReturnValue(`${count} items`);

        const actual = i18n.tp('key', count, [String(count)]);

        expect(actual).toBe(expected);
      },
    );

    it.each([
      [0, '0 items'],
      [1, '1 item'],
      [2, '2 items'],
      [3, '3 items'],
    ])(
      'should return the correct string for format "{1} | {n}" and count=%s',
      (count, expected) => {
        const i18n = createExtensionI18n();
        getMessageMock.mockReturnValue(`1 item | ${count} items`);

        const actual = i18n.tp('key', count, [String(count)]);

        expect(actual).toBe(expected);
      },
    );

    it.each([
      [0, '0 items'],
      [1, '1 item'],
      [2, '2 items'],
      [3, '3 items'],
    ])(
      'should return the correct string for format "{0} | {1} | {n}" and count=%s',
      (count, expected) => {
        const i18n = createExtensionI18n();
        getMessageMock.mockReturnValue(`0 items | 1 item | ${count} items`);

        const actual = i18n.tp('key', count, [String(count)]);

        expect(actual).toBe(expected);
      },
    );

    it('should pass substitutions in correctly', () => {
      const i18n = createExtensionI18n();
      const key = 'key';
      const count = 4;
      const subs = ['1', 'two'];
      getMessageMock.mockReturnValue(`0 items | 1 item | ${count} items`);

      i18n.tp(key, count, subs);

      expect(getMessageMock).toBeCalledWith(key, subs);
    });
  });

  it('should support custom types', () => {
    const i18n = createExtensionI18n<{
      t: {
        singularNoSubs: undefined;
        singularOneSub: [name: string];
        singularTwoSubs: [string, string];
      };
      tp: {
        pluralNoSubs: undefined;
        pluralOneSub: [name: string];
        pluralTwoSubs: [string, string];
      };
    }>();
    getMessageMock.mockReturnValue('');

    i18n.t('singularNoSubs');
    // @ts-expect-error
    i18n.t('singularNoSubs', ['1', '2']);

    i18n.t('singularOneSub', ['one']);
    // @ts-expect-error
    i18n.t('singularOneSub');

    i18n.t('singularTwoSubs', ['one', 'two']);
    // @ts-expect-error
    i18n.t('singularTwoSubs', ['one']);
    // @ts-expect-error
    i18n.t('singularTwoSubs');

    // @ts-expect-error
    i18n.t('pluralNoSubs');
    // @ts-expect-error
    i18n.t('pluralOneSub');
    // @ts-expect-error
    i18n.t('pluralTwoSubs');

    i18n.tp('pluralNoSubs', 0);
    // @ts-expect-error
    i18n.tp('pluralNoSubs', 0, ['1', '2']);
    // @ts-expect-error
    i18n.tp('pluralNoSubs');

    i18n.tp('pluralOneSub', 0, ['one']);
    // @ts-expect-error
    i18n.tp('pluralOneSub', 0);

    i18n.tp('pluralTwoSubs', 0, ['one', 'two']);
    // @ts-expect-error
    i18n.tp('pluralTwoSubs', 0, ['one']);
    // @ts-expect-error
    i18n.tp('pluralTwoSubs', 0);

    // @ts-expect-error
    i18n.tp('singularNoSubs');
    // @ts-expect-error
    i18n.tp('singularOneSub');
    // @ts-expect-error
    i18n.tp('singularTwoSubs');
  });
});
