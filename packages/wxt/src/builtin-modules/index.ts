import { WxtModule } from '../types';
import unimport from './unimport';
import faviconPermission from './favicon-permission';

export const builtinModules: WxtModule<any>[] = [unimport, faviconPermission];
