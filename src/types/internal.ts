import * as vite from 'vite';
import { Logger, TargetBrowser } from './external';

export interface InternalConfig {
  srcDir: string;
  storeIds: {
    chrome?: string;
    firefox?: string;
    edge?: string;
  };
  mode: string;
  browser: TargetBrowser;
  logger: Logger;
  vite?: vite.InlineConfig;
}
