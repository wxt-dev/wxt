import { beforeEach, describe, it, vi } from 'vitest';
import { createI18n } from '..';
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

const n: number = 1;

describe('I18n Types', () => {
  beforeEach(() => {
    getMessageMock.mockReturnValue('Some text.');
  });

  describe('No type-safety', () => {
    const i18n = createI18n();

    describe('t', () => {
      it('should allow passing any combination of arguments', () => {
        i18n.t('any');
        i18n.t('any', ['one']);
        i18n.t('any', ['one', 'two']);
        i18n.t('any', n, ['one', 'two']);
      });
    });
  });

  describe('With type-safety', () => {
    const i18n = createI18n<{
      simple: { plural: false; substitutions: 0 };
      simpleSub1: { plural: false; substitutions: 1 };
      simpleSub2: { plural: false; substitutions: 2 };
      plural: { plural: true; substitutions: 0 };
      pluralSub1: { plural: true; substitutions: 1 };
      pluralSub2: { plural: true; substitutions: 2 };
    }>();

    describe('t', () => {
      it('should only allow passing valid combinations of arguments', () => {
        i18n.t('simple');
        // @ts-expect-error
        i18n.t('simple', []);
        // @ts-expect-error
        i18n.t('simple', ['one']);
        // @ts-expect-error
        i18n.t('simple', n);

        i18n.t('simpleSub1', ['one']);
        // @ts-expect-error
        i18n.t('simpleSub1');
        // @ts-expect-error
        i18n.t('simpleSub1', []);
        // @ts-expect-error
        i18n.t('simpleSub1', ['one', 'two']);
        // @ts-expect-error
        i18n.t('simpleSub1', n);

        i18n.t('simpleSub2', ['one', 'two']);
        // @ts-expect-error
        i18n.t('simpleSub2');
        // @ts-expect-error
        i18n.t('simpleSub2', ['one']);
        // @ts-expect-error
        i18n.t('simpleSub2', ['one', 'two', 'three']);
        // @ts-expect-error
        i18n.t('simpleSub2', n);

        i18n.t('plural', n);
        // @ts-expect-error
        i18n.t('plural');
        // @ts-expect-error
        i18n.t('plural', []);
        // @ts-expect-error
        i18n.t('plural', ['one']);
        // @ts-expect-error
        i18n.t('plural', n, ['sub']);

        i18n.t('pluralSub1', n);
        i18n.t('pluralSub1', n, undefined);
        i18n.t('pluralSub1', n, ['one']);
        // @ts-expect-error
        i18n.t('pluralSub1');
        // @ts-expect-error
        i18n.t('pluralSub1', ['one']);
        // @ts-expect-error
        i18n.t('pluralSub1', n, []);
        // @ts-expect-error
        i18n.t('pluralSub1', n, ['one', 'two']);

        i18n.t('pluralSub2', n, ['one', 'two']);
        // @ts-expect-error
        i18n.t('pluralSub2');
        // @ts-expect-error
        i18n.t('pluralSub2', ['one', 'two']);
        // @ts-expect-error
        i18n.t('pluralSub2', n, ['one']);
        // @ts-expect-error
        i18n.t('pluralSub2', n, ['one', 'two', 'three']);
        // @ts-expect-error
        i18n.t('pluralSub2', n);
      });
    });
  });
});
