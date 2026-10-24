import { WxtModule } from '../../types';
import faviconPermission from './favicon-permission';
import unimport from './unimport';
import escapeUnicode from './escape-unicode';
import autoIncludeSources from './auto-include-sources';

export const builtinModules: WxtModule<any>[] = [
  unimport,
  faviconPermission,
  escapeUnicode,
  autoIncludeSources,
];
