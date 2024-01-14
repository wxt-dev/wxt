import { readFile } from 'node:fs/promises';
import JSON5 from 'json5';
import YAML from 'yaml';

/**
 * Convert a file containing localized text in WXT's custom format into valid extension manifest
 * format.
 */
export async function readMessagesFile(file: string): Promise<Message[]> {
  const text = await readFile(file, 'utf-8');
  return readMessagesText(text);
}

/**
 * Convert a string containing localized text in WXT's custom format into valid extension manifest
 * format.
 */
export function readMessagesText(text: string): Message[] {
  const parsers: Array<(text: string) => any> = [
    JSON.parse,
    JSON5.parse,
    YAML.parse,
  ];

  for (const parse of parsers) {
    try {
      const result = parse(text);
      if (typeof result === 'object') {
        return readMessagesObject(result);
      }
    } catch {
      continue;
    }
  }

  throw Error('I18n messages text is not valid JSON, JSON5, or YAML');
}

/**
 * Convert an object containing localized text in WXT's custom format into valid extension manifest
 * format.
 */
export function readMessagesObject(input: ExtensionI18nSchema): Message[] {
  const messagesFromInput = findEntries([], input);
  return [...messagesFromInput, ...PREDEFINED_MESSAGES];
}

export function convertMessagesToManifest(
  messages: Message[],
): RawExtensionI18nSchema {
  return messages
    .filter((message) => !message.isBuiltin)
    .reduce<RawExtensionI18nSchema>((schema, { name, entry }) => {
      schema[name] = entry;
      return schema;
    }, {});
}

function findEntries(
  keyPath: string[],
  input: ExtensionI18nSchema | ExtensionI18nEntry,
): Message[] {
  const name = keyPath.join('_');
  if (isBasicEntry(input))
    return [
      {
        name,
        entry: { message: input },
      },
    ];
  if (isManifestEntry(input))
    return [
      {
        name,
        entry: input,
      },
    ];
  if (isPluralEntry(input))
    return [
      {
        name,
        entry: {
          message: Object.values(input).join(' | '),
        },
        isPlural: true,
      },
    ];

  return Object.entries(input).reduce<Message[]>((items, [key, child]) => {
    const nestedEntries = findEntries(keyPath.concat(key), child);
    return [...items, ...nestedEntries];
  }, []);
}

function isBasicEntry(
  entry: ExtensionI18nSchema | ExtensionI18nEntry,
): entry is ExtensionI18nBasicEntry {
  return typeof entry === 'string';
}

function isManifestEntry(
  entry: ExtensionI18nSchema | ExtensionI18nEntry,
): entry is ExtensionI18nManifestEntry {
  const keys = Object.keys(entry);
  if (keys.length < 1 || keys.length > 3) return false;

  const knownKeys = new Set(['message', 'placeholders', 'description']);
  const unknownKeys = keys.filter((key) => !knownKeys.has(key));
  return unknownKeys.length === 0;
}

function isPluralEntry(
  entry: ExtensionI18nSchema | ExtensionI18nEntry,
): entry is ExtensionI18nPluralEntry {
  const keys = Object.keys(entry);
  if (keys.length === 0) return false;

  const invalidKeys = keys.filter((key) => key !== 'n' && isNaN(Number(key)));
  return invalidKeys.length === 0;
}

export const PREDEFINED_MESSAGES: Message[] = [
  {
    name: '@@extension_id',
    isBuiltin: true,
    entry: {
      message: '<browser.runtime.id>',
      description:
        "The extension or app ID; you might use this string to construct URLs for resources inside the extension. Even unlocalized extensions can use this message.\nNote: You can't use this message in a manifest file.",
    },
  },
  {
    name: '@@ui_locale',
    isBuiltin: true,
    entry: {
      message: '<browser.i18n.getUiLocale()>',
    },
  },
  {
    name: '@@bidi_dir',
    isBuiltin: true,
    entry: {
      message: '<ltr|rtl>',
      description:
        'The text direction for the current locale, either "ltr" for left-to-right languages such as English or "rtl" for right-to-left languages such as Japanese.',
    },
  },
  {
    name: '@@bidi_reversed_dir',
    isBuiltin: true,
    entry: {
      message: '<rtl|ltr>',
      description:
        'If the @@bidi_dir is "ltr", then this is "rtl"; otherwise, it\'s "ltr".',
    },
  },
  {
    name: '@@bidi_start_edge',
    isBuiltin: true,
    entry: {
      message: '<left|right>',
      description:
        'If the @@bidi_dir is "ltr", then this is "left"; otherwise, it\'s "right".',
    },
  },
  {
    name: '@@bidi_end_edge',
    isBuiltin: true,
    entry: {
      message: '<right|left>',
      description:
        'If the @@bidi_dir is "ltr", then this is "right"; otherwise, it\'s "left".',
    },
  },
];

export type RawExtensionI18nSchema = Record<string, RawExtensionI18nEntry>;
export interface RawExtensionI18nEntry {
  message: string;
  description?: string;
  placeholders?: Record<
    string,
    {
      content: string;
      example?: string;
    }
  >;
}

export type ExtensionI18nBasicEntry = string;
export type ExtensionI18nManifestEntry = RawExtensionI18nEntry;
export type ExtensionI18nPluralEntry = {
  n: string;
  [i: number]: string;
};
export type ExtensionI18nEntry =
  | ExtensionI18nBasicEntry
  | ExtensionI18nManifestEntry
  | ExtensionI18nPluralEntry;

export interface ExtensionI18nSchema {
  [name: string]: ExtensionI18nSchema | ExtensionI18nEntry;
}

export interface Message {
  name: string;
  entry: RawExtensionI18nEntry;
  isPlural?: boolean;
  isBuiltin?: boolean;
}
