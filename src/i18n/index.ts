import { DefaultMessageSchema, createExtensionI18n } from './client';

export interface WxtMessageSchema extends DefaultMessageSchema {
  // Overriden per-project
}

export const i18n = createExtensionI18n<WxtMessageSchema>();
export * from './client';
