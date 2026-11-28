import safari from '@wxt-dev/module-safari';

import { WxtModule } from '../../types';
import escapeUnicode from './escape-unicode';
import faviconPermission from './favicon-permission';
import plugins from './plugins';
import unimport from './unimport';

export const builtinModules: WxtModule<any>[] = [
  unimport,
  faviconPermission,
  escapeUnicode,
  plugins,
  safari as unknown as WxtModule<any>,
];
