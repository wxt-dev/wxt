import { readFile } from 'node:fs/promises';
import JSON5 from 'json5';
import YAML from 'yaml';

/**
 * Convert a file containing localized text in WXT's custom format into valid extension manifest
 * format.
 */
export async function convertMessagesFile(
  file: string,
): Promise<ExtensionI18nSchema> {
  const text = await readFile(file, 'utf-8');
  return convertMessagesText(text);
}

/**
 * Convert a string containing localized text in WXT's custom format into valid extension manifest
 * format.
 */
export function convertMessagesText(text: string): ExtensionI18nSchema {
  const parsers: Array<(text: string) => any> = [
    JSON.parse,
    JSON5.parse,
    YAML.parse,
  ];

  for (const parse of parsers) {
    try {
      const result = parse(text);
      if (typeof result === 'object') {
        return convertMessagesObject(result);
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
export function convertMessagesObject(
  input: WxtI18nSchema,
): ExtensionI18nSchema {
  const entries = findEntries([], input);
  return entries.reduce<ExtensionI18nSchema>((schema, { name, entry }) => {
    schema[name.join('_')] = entry;
    return schema;
  }, {});
}

function findEntries(
  keyPath: string[],
  input: WxtI18nSchema | WxtI18nEntry,
): DetectedEntry[] {
  if (isBasicEntry(input))
    return [
      {
        name: keyPath,
        entry: { message: input },
      },
    ];
  if (isManifestEntry(input))
    return [
      {
        name: keyPath,
        entry: input,
      },
    ];
  if (isPluralEntry(input))
    return [
      {
        name: keyPath,
        entry: {
          message: Object.values(input).join(' | '),
        },
      },
    ];

  return Object.entries(input).reduce<DetectedEntry[]>(
    (items, [key, child]) => {
      const nestedEntries = findEntries(keyPath.concat(key), child);
      return [...items, ...nestedEntries];
    },
    [],
  );
}

function isBasicEntry(
  entry: WxtI18nSchema | WxtI18nEntry,
): entry is WxtI18nBasicEntry {
  return typeof entry === 'string';
}

function isManifestEntry(
  entry: WxtI18nSchema | WxtI18nEntry,
): entry is WxtI18nManifestEntry {
  const keys = Object.keys(entry);
  if (keys.length < 1 || keys.length > 3) return false;

  const knownKeys = new Set(['message', 'placeholders', 'description']);
  const unknownKeys = keys.filter((key) => !knownKeys.has(key));
  return unknownKeys.length === 0;
}

function isPluralEntry(
  entry: WxtI18nSchema | WxtI18nEntry,
): entry is WxtI18nPluralEntry {
  const keys = Object.keys(entry);
  if (keys.length === 0) return false;

  const invalidKeys = keys.filter((key) => key !== 'n' && isNaN(Number(key)));
  return invalidKeys.length === 0;
}

export type ExtensionI18nSchema = Record<string, ExtensionI18nEntry>;
export interface ExtensionI18nEntry {
  message: string;
  descritption?: string;
  placeholders?: Record<
    string,
    {
      content: string;
      example?: string;
    }
  >;
}

export type WxtI18nBasicEntry = string;
export type WxtI18nManifestEntry = ExtensionI18nEntry;
export type WxtI18nPluralEntry = {
  n: string;
  [i: number]: string;
};
export type WxtI18nEntry =
  | WxtI18nBasicEntry
  | WxtI18nManifestEntry
  | WxtI18nPluralEntry;

export interface WxtI18nSchema {
  [name: string]: WxtI18nSchema | WxtI18nEntry;
}

interface DetectedEntry {
  name: string[];
  entry: ExtensionI18nEntry;
}
