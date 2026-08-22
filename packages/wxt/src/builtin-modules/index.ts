import { WxtModule } from '../types';
import faviconPermission from './favicon-permission';
import unimport from './unimport';
import escapeUnicode from './escape-unicode';
import adb from './adb';

export const builtinModules: WxtModule<any>[] = [
  unimport,
  faviconPermission,
  escapeUnicode,
  adb,
];
