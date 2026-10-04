import { WxtModule } from '../types';
import faviconPermission from './favicon-permission';
import unimport from './unimport';
import escapeUnicode from './escape-unicode';

export const builtinModules: WxtModule<any>[] = [
  unimport,
  faviconPermission,
  escapeUnicode,
];
