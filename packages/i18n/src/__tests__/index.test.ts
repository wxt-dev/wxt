import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createI18n } from '../index';

const getMessageMock = vi.fn();

vi.stubGlobal('chrome', {
  i18n: {
    getMessage: getMessageMock,
  },
});

describe('createI18n', () => {
  beforeEach(() => {
    getMessageMock.mockReturnValue('Some text.');
  });

  it.each([
    ['key', 'key'],
    ['some_key', 'some_key'],
    ['some.nested.key', 'some_nested_key'],
  ])('should retrieve "%s" as "%s"', (input, expectedKey) => {
    const i18n = createI18n();
    const expectedValue = String(Math.random());
    getMessageMock.mockReturnValue(expectedValue);

    const actual = i18n.t(input);

    expect(actual).toBe(expectedValue);
    expect(getMessageMock).toBeCalledTimes(1);
    expect(getMessageMock).toBeCalledWith(expectedKey);
  });

  it.each([
    ['n items', 0, 'n items'],
    ['n items', 1, 'n items'],
    ['n items', 2, 'n items'],
    ['n items', 3, 'n items'],
    ['1 item | n items', 0, 'n items'],
    ['1 item | n items', 1, '1 item'],
    ['1 item | n items', 2, 'n items'],
    ['1 item | n items', 3, 'n items'],
    ['0 items | 1 item | n items', 0, '0 items'],
    ['0 items | 1 item | n items', 1, '1 item'],
    ['0 items | 1 item | n items', 2, 'n items'],
    ['0 items | 1 item | n items', 3, 'n items'],
  ])(
    'should retrieve plural forms correctly',
    (rawMessage, count, expected) => {
      const i18n = createI18n();
      getMessageMock.mockReturnValue(rawMessage);
      const key = 'items';

      const actual = i18n.t(key, count);

      expect(actual).toBe(expected);
      expect(getMessageMock).toBeCalledTimes(1);
      expect(getMessageMock).toBeCalledWith(key, [String(count)]);
    },
  );

  it('should allow overriding the plural substitutions', () => {
    const i18n = createI18n();
    i18n.t('key', 3, ['custom']);
    expect(getMessageMock).toBeCalledWith('key', ['custom']);
  });

  it('should respect the custom t(...) overloads passed into it', () => {
    interface TestI18n {
      t(key: 'key1'): string;
      t(key: 'key2', sub: [string]): string;
      t(key: 'key3', count: number): string;
      t(key: 'key4', count: number, sub: [string, number]): string;
    }
    const i18n = createI18n<TestI18n>();
    // @ts-expect-error: Doesn't like my custom overload, but the type is respected properly
    const tryT: typeof i18n.t = (...args: any[]) => {
      try {
        // @ts-expect-error
        i18n.t(...args);
      } catch {
        // ignore runtime errors for this test
      }
    };

    tryT('key1');
    // @ts-expect-error
    tryT('not-key1');

    tryT('key2', ['asdf']);
    // @ts-expect-error
    tryT('key1', ['asdf']);
    // @ts-expect-error
    tryT('key2', []);
    // @ts-expect-error
    tryT('key2', [123]);

    tryT('key3', 2);
    // @ts-expect-error
    tryT('not-key3', 2);
    // @ts-expect-error
    tryT('key3', 'a');
    // @ts-expect-error
    tryT('key3', 2, ['a']);
    // @ts-expect-error
    tryT('key3', ['a']);

    tryT('key4', 2, ['a', 2]);
    // @ts-expect-error
    tryT('key4', 'a', ['a', 2]);
    // @ts-expect-error
    tryT('key4', 'a', [2, 'a']);
    // @ts-expect-error
    tryT('not-key4', 2, ['a', 2]);
    // @ts-expect-error
    tryT('key4', 2, [2]);
  });
});
