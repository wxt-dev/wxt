/// <reference types="chrome" />
import { describe, expectTypeOf, it } from 'vitest';
import { browser, type Browser } from '../index';

describe('browser', () => {
  describe('types', () => {
    it('should provide types via the Browser import', () => {
      expectTypeOf<Browser.runtime.MessageSender>().toEqualTypeOf<chrome.runtime.MessageSender>();
      expectTypeOf<Browser.storage.AreaName>().toEqualTypeOf<chrome.storage.AreaName>();
      expectTypeOf<Browser.i18n.LanguageDetectionResult>().toEqualTypeOf<chrome.i18n.LanguageDetectionResult>();
    });

    it('should provide values via the browser import', () => {
      expectTypeOf<typeof browser.runtime.id>().toEqualTypeOf<string>();
      expectTypeOf<
        typeof browser.storage.local
      >().toEqualTypeOf<Browser.storage.LocalStorageArea>();
      expectTypeOf<
        typeof browser.i18n.detectLanguage
      >().returns.resolves.toEqualTypeOf<chrome.i18n.LanguageDetectionResult>();
    });
  });
});
