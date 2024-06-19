import { AugmentedBrowser } from '.';

/**
 * During development, return a proxy around the i18n that listens for updated
 * locales from the dev server, and returns any strings based on the latest
 * localizations.
 */
export function modifyI18n(
  browser: AugmentedBrowser,
  ogI18n: AugmentedBrowser['i18n'],
) {
  if (import.meta.env.COMMAND !== 'serve') return ogI18n;

  let manifest: any | undefined;
  let locale: string | undefined;
  let latestTranslationsCache:
    | {
        [locale: string]:
          | Record<string, { message: string } | undefined>
          | undefined;
      }
    | undefined;

  /**
   * 1. Return the UI's locale (en_US)
   * 2. Return the UI's locale minus the region (en)
   * 3. Return the manifest's default_locale
   */
  const detectLocale = () => {
    const uiLocale = ogI18n.getMessage('@@ui_locale'); // "en_US"
    if (latestTranslationsCache?.[uiLocale]) return uiLocale;

    if (uiLocale.length > 2) {
      const noRegionUiLocale = uiLocale.substring(0, 2); // "en"
      if (latestTranslationsCache?.[noRegionUiLocale]) return noRegionUiLocale;
    }

    manifest ??= browser.runtime.getManifest();
    return manifest.default_locale;
  };

  const customGetMessage: AugmentedBrowser['i18n']['getMessage'] = (
    messageName,
    substitutions,
  ) => {
    locale ??= detectLocale();
    console.log({ locale });
    if (locale != null) {
      const message = latestTranslationsCache?.[locale]?.[messageName];
      console.log({ locale, message });
      if (message) return message.message;
    }

    return ogI18n.getMessage(messageName, substitutions);
  };

  return new Proxy(ogI18n, {
    get(target, p, receiver) {
      if (p === 'getMessage') return customGetMessage;
      return Reflect.get(target, p, receiver);
    },
  });
}
