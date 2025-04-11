import { WxtModule } from '../types';
import unimport from './unimport';
import faviconTypes from './favicon-type';

export const builtinModules: WxtModule<any>[] = [unimport, faviconTypes];
