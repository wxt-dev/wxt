import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parseYAML, parseJSON5, parseTOML, stringifyYAML } from 'confbox';
import { dirname, extname } from 'node:path';

//
// TYPES
//

export interface ChromeMessage {
  message: string;
  description?: string;
  placeholders?: Record<string, { content: string; example?: string }>;
}

export interface ParsedBaseMessage {
  key: string;
}

export interface ParsedChromeMessage extends ParsedBaseMessage, ChromeMessage {
  type: 'chrome';
}
export interface ParsedSimpleMessage extends ParsedBaseMessage {
  type: 'simple';
  message: string;
}
export interface ParsedPluralMessage extends ParsedBaseMessage {
  type: 'plural';
  plurals: { [count: string]: string };
}

export type ParsedMessage =
  | ParsedChromeMessage
  | ParsedSimpleMessage
  | ParsedPluralMessage;

export type MessageFormat = 'JSON5' | 'YAML' | 'TOML';

//
// CONSTANTS
//

/**
 * See https://developer.chrome.com/docs/extensions/reference/api/i18n#overview-predefined
 */
const PREDEFINED_MESSAGES: Record<string, ChromeMessage> = {
  '@@extension_id': {
    message: '<browser.runtime.id>',
    description:
      "The extension or app ID; you might use this string to construct URLs for resources inside the extension. Even unlocalized extensions can use this message.\nNote: You can't use this message in a manifest file.",
  },
  '@@ui_locale': {
    message: '<browser.i18n.getUiLocale()>',
    description: '',
  },
  '@@bidi_dir': {
    message: '<ltr|rtl>',
    description:
      'The text direction for the current locale, either "ltr" for left-to-right languages such as English or "rtl" for right-to-left languages such as Japanese.',
  },
  '@@bidi_reversed_dir': {
    message: '<rtl|ltr>',
    description:
      'If the @@bidi_dir is "ltr", then this is "rtl"; otherwise, it\'s "ltr".',
  },
  '@@bidi_start_edge': {
    message: '<left|right>',
    description:
      'If the @@bidi_dir is "ltr", then this is "left"; otherwise, it\'s "right".',
  },
  '@@bidi_end_edge': {
    message: '<right|left>',
    description:
      'If the @@bidi_dir is "ltr", then this is "right"; otherwise, it\'s "left".',
  },
};

const EXT_FORMATS_MAP: Record<string, MessageFormat> = {
  '.json': 'JSON5',
  '.jsonc': 'JSON5',
  '.json5': 'JSON5',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.toml': 'TOML',
};

const PARSERS: Record<MessageFormat, (text: string) => any> = {
  YAML: parseYAML,
  JSON5: parseJSON5,
  TOML: parseTOML,
};

const ALLOWED_CHROME_MESSAGE_KEYS: Set<string> = new Set<keyof ChromeMessage>([
  'description',
  'message',
  'placeholders',
]);

//
// PARSING
//

/**
 * Parse a messages file, extract the messages. Supports JSON, JSON5, and YAML.
 */
export async function parseMessagesFile(
  file: string,
): Promise<ParsedMessage[]> {
  const text = await readFile(file, 'utf8');
  const ext = extname(file).toLowerCase();
  return parseMessagesText(text, EXT_FORMATS_MAP[ext] ?? 'JSON5');
}

/**
 * Parse a string, extracting the messages. Supports JSON, JSON5, and YAML.
 */
export function parseMessagesText(
  text: string,
  format: 'JSON5' | 'YAML' | 'TOML',
): ParsedMessage[] {
  return parseMessagesObject(PARSERS[format](text));
}

/**
 * Given the JS object form of a raw messages file, extract the messages.
 */
export function parseMessagesObject(object: any): ParsedMessage[] {
  return _parseMessagesObject([], {
    ...object,
    ...PREDEFINED_MESSAGES,
  });
}

function _parseMessagesObject(path: string[], object: any): ParsedMessage[] {
  switch (typeof object) {
    case 'string':
    case 'bigint':
    case 'boolean':
    case 'number':
    case 'symbol':
      return [{ type: 'simple', key: path.join('_'), message: String(object) }];
    case 'object':
      if (Array.isArray(object))
        return object.flatMap((item, i) =>
          _parseMessagesObject(path.concat(String(i)), item),
        );
      if (isPluralMessage(object))
        return [{ key: path.join('_'), type: 'plural', plurals: object }];
      if (isChromeMessage(object))
        return [{ key: path.join('_'), type: 'chrome', ...object }];
      return Object.entries(object).flatMap(([key, value]) =>
        _parseMessagesObject(path.concat(key), value),
      );
    default:
      throw Error(`"Could not parse object of type "${typeof object}"`);
  }
}

function isPluralMessage(object: any): object is Record<number | 'n', string> {
  return Object.keys(object).every(
    (key) => key === 'n' || isFinite(Number(key)),
  );
}

function isChromeMessage(object: any): object is ChromeMessage {
  return Object.keys(object).every((key) =>
    ALLOWED_CHROME_MESSAGE_KEYS.has(key),
  );
}

//
// OUTPUT
//

export function generateDtsText(
  messages: ParsedMessage[],
  interfaceName: string,
): string {
  const overloads: string[] = messages.map((message) => {
    // TODO: detect substitutions, don't always include it
    if (message.type === 'plural') {
      return `  /**
${stringifyYAML(message.plurals, { forceQuotes: true, quotingType: '"' })
  .split('\n')
  .map((line) => '   * ' + line)
  .join('\n')}
   */
  t(key: "${message.key}", count: number, sub?: import("@wxt-dev/i18n").Substitution[]): string`;
    }
    return `  /**
   * "${message.message}"
   */
  t(key: "${message.key}", sub?: import("@wxt-dev/i18n").Substitution[]): string`;
  });

  return `declare interface ${interfaceName} {
${overloads.join('\n')}
}
`;
}

export async function generateDtsFile(
  outFile: string,
  messages: ParsedMessage[],
  interfaceName: string,
): Promise<void> {
  const text = generateDtsText(messages, interfaceName);
  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, text, 'utf8');
}

export function generateChromeMessages(
  messages: ParsedMessage[],
): Record<string, ChromeMessage> {
  return messages.reduce<Record<string, ChromeMessage>>((acc, message) => {
    // Don't output predefined messages
    if (PREDEFINED_MESSAGES[message.key]) return acc;

    switch (message.type) {
      case 'chrome':
        acc[message.key] = {
          message: message.message,
          description: message.description,
          placeholders: message.placeholders,
        };
        break;
      case 'plural':
        acc[message.key] = {
          message: Object.values(message.plurals).join(' | '),
        };
        break;
      case 'simple':
        acc[message.key] = {
          message: message.message,
        };
        break;
    }
    return acc;
  }, {});
}

export function generateChromeMessagesText(messages: ParsedMessage[]): string {
  const raw = generateChromeMessages(messages);
  return JSON.stringify(raw, null, 2);
}

export async function generateChromeMessagesFile(
  file: string,
  messages: ParsedMessage[],
): Promise<void> {
  const text = generateChromeMessagesText(messages);
  await writeFile(file, text + '\n', 'utf8');
}
