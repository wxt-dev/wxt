import { WxtModule } from '../types';
import unimport from './unimport';
import wxtTypes from './wxt-types';

export const builtinModules: WxtModule<any>[] = [unimport, wxtTypes];
