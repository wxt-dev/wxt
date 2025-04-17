import { WxtModule } from '../types';
import unimport from './unimport';
import faviconPermissions from './favicon-permission';

export const builtinModules: WxtModule<any>[] = [unimport, faviconPermissions];
