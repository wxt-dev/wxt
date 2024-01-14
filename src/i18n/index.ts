/**
 * Simple, type-safe alternative to `browser.i18n.getMessage` with support for placeholders and plurals.
 *
 * See [the guide](https://wxt.dev/guide/localization.html) for more information.
 *
 * @module wxt/i18n
 */

import { DefaultMessageSchema, createExtensionI18n } from './client';

export interface WxtMessageSchema extends DefaultMessageSchema {
  // Overriden per-project
}

export const i18n = createExtensionI18n<WxtMessageSchema>();
export {
  DefaultMessageSchema,
  ExtensionI18n,
  TypedExtensionI18n,
  UntypedExtensionI18n,
} from './client';
