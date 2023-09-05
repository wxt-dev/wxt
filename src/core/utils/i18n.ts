export interface Message {
  name: string;
  message: string;
  description?: string;
}

/**
 * Get a list of all messages and their metadata from JSON file contents.
 *
 * @param messagesJson The contents of a `_locales/en/messages.json` file.
 */
export function parseI18nMessages(messagesJson: object): Message[] {
  return Object.entries(messagesJson).map<Message>(([name, details]) => ({
    name,
    ...details,
  }));
}
