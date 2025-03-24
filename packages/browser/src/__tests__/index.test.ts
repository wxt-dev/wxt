/// <reference types="chrome" />
import { describe, expectTypeOf, it } from 'vitest';
import { browser, Browser } from '../index';

describe('browser', () => {
  describe('types', () => {
    it('should provide types via the Browser import', () => {
      expectTypeOf<Browser.runtime.MessageSender>().toMatchTypeOf<chrome.runtime.MessageSender>();
      expectTypeOf<Browser.storage.AreaName>().toMatchTypeOf<chrome.storage.AreaName>();
      expectTypeOf<Browser.i18n.LanguageDetectionResult>().toMatchTypeOf<chrome.i18n.LanguageDetectionResult>();
    });

    it('should provide values via the browser import', () => {
      expectTypeOf(browser.runtime.id).toMatchTypeOf<string>();
      expectTypeOf(
        browser.storage.local,
      ).toMatchTypeOf<Browser.storage.StorageArea>();
      expectTypeOf(
        browser.i18n.detectLanguage('Hello, world!'),
      ).resolves.toMatchTypeOf<chrome.i18n.LanguageDetectionResult>();
    });
  });
});
