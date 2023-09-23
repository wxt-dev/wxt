import { InternalConfig } from '../types';

export interface ExtensionRunner {
  openBrowser(config: InternalConfig): Promise<void>;
  closeBrowser(): Promise<void>;
}
