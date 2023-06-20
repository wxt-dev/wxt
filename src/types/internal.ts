import * as vite from 'vite';
import { TargetBrowser } from './external';

export interface InternalConfig {
  srcDir: string;
  storeIds: {
    chrome?: string;
    firefox?: string;
    edge?: string;
  };
  mode: string;
  browser: TargetBrowser;
  vite?: vite.InlineConfig;
}
