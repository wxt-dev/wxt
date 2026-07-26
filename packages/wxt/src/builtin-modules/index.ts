import { WxtModule } from '../types';
import faviconPermission from './favicon-permission';
import unimport from './unimport';

export const builtinModules: WxtModule<any>[] = [unimport, faviconPermission];
