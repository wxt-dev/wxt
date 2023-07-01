import { InternalConfig } from '../types';

export interface ExtensionRunner {
  openBrowser(config: InternalConfig): Promise<void>;
  // TODO: replace with WS message to background script
  reload(): Promise<void>;
  closeBrowser(): Promise<void>;
}
