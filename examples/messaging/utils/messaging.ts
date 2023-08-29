import { defineExtensionMessaging } from '@webext-core/messaging';

// Define the available messages, data types, and response types.
interface MessagingProtocol {
  getStringLength(data: string): number;
}

export const { sendMessage, onMessage } =
  defineExtensionMessaging<MessagingProtocol>();
