import { browser } from '@wxt-dev/browser';
import { describe, it, expect, vi } from 'vitest';

import { generateChromeMessages, parseMessagesObject } from '../build';
import { createI18n } from '../index';

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

/** Serve the generated messages.json like `browser.i18n.getMessage` does. */
function useMessages(object: Parameters<typeof parseMessagesObject>[0]) {
  const messages = generateChromeMessages(parseMessagesObject(object));
  getMessageMock.mockImplementation((key, substitutions) =>
    (messages[key]?.message ?? '').replace(/\$(\d)/g, (_, index) =>
      String([substitutions ?? []].flat()[Number(index) - 1] ?? ''),
    ),
  );
}

describe('plural messages from build to runtime', () => {
  it.each([
    [0, 'No items'],
    [1, '1 items'],
    [2, '2 items'],
  ])(
    'should use the right form for %i when only 0 and n are defined',
    (count, expected) => {
      useMessages({ items: { 0: 'No items', n: '$1 items' } });

      expect(createI18n().t('items', count)).toBe(expected);
    },
  );

  it.each([
    [0, '0 items'],
    [1, 'One item'],
    [2, '2 items'],
  ])(
    'should keep the existing behavior of 1 and n for %i',
    (count, expected) => {
      useMessages({ items: { 1: 'One item', n: '$1 items' } });

      expect(createI18n().t('items', count)).toBe(expected);
    },
  );

  it.each([
    [0, 'No items'],
    [1, 'One item'],
    [5, '5 items'],
  ])(
    'should keep the existing behavior of 0, 1 and n for %i',
    (count, expected) => {
      useMessages({ items: { 0: 'No items', 1: 'One item', n: '$1 items' } });

      expect(createI18n().t('items', count)).toBe(expected);
    },
  );

  it('should resolve numeric nested keys', () => {
    useMessages({ errors: { 404: 'Not found', 500: 'Server error' } });

    expect(createI18n().t('errors.404')).toBe('Not found');
  });
});
