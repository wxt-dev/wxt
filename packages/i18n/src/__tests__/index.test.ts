import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createI18n } from '../index';
import { browser } from '@wxt-dev/browser';

vi.mock('@wxt-dev/browser', async () => {
  const { vi } = await import('vitest');
  return {
    browser: {
      i18n: {
        getMessage: vi.fn(),
      },
    },
  };
});
const getMessageMock = vi.mocked(browser.i18n.getMessage);

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

  it('should replace named substitutions', () => {
    const i18n = createI18n();
    getMessageMock.mockReturnValue('My name is {name}, and I use {tool}.');

    const actual = i18n.t('key', {
      name: 'Ada',
      tool: 'WXT',
    });

    expect(actual).toBe('My name is Ada, and I use WXT.');
    expect(getMessageMock).toBeCalledTimes(1);
    expect(getMessageMock).toBeCalledWith('key');
  });

  it('should leave unknown named substitutions unchanged', () => {
    const i18n = createI18n();
    getMessageMock.mockReturnValue('Hello {name} from {team}.');

    const actual = i18n.t('key', { name: 'Ada' });

    expect(actual).toBe('Hello Ada from {team}.');
  });

  it('should combine positional and named substitutions', () => {
    const i18n = createI18n();
    getMessageMock.mockReturnValue('Hello Ada from {team}.');

    const actual = i18n.t('key', ['Ada'], { team: 'WXT' });

    expect(actual).toBe('Hello Ada from WXT.');
    expect(getMessageMock).toBeCalledWith('key', ['Ada']);
  });

  it('should replace named substitutions after pluralization', () => {
    const i18n = createI18n();
    getMessageMock.mockReturnValue('One {item} | Multiple {item}');

    const actual = i18n.t('key', 2, { item: 'files' });

    expect(actual).toBe('Multiple files');
    expect(getMessageMock).toBeCalledWith('key', ['2']);
  });
});
