import { WxtModule } from '../types';
import faviconPermission from './favicon-permission';
import unimport from './unimport';
import escapeUtf8 from './escape-utf8';

export const builtinModules: WxtModule<any>[] = [
  unimport,
  faviconPermission,
  escapeUtf8,
];
