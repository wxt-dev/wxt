import { WxtModuleWithMetadata } from '~/types';
import unimport from './unimport';

export const builtinModules: WxtModuleWithMetadata<any>[] = [unimport].map(
  (module) => ({ ...module, type: 'built-in' }),
);
