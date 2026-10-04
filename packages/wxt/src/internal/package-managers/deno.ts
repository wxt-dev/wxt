import { WxtPackageManagerImpl } from './types';

export const deno: WxtPackageManagerImpl = {
  overridesKey: 'na',
  downloadDependency() {
    throw Error('Deno not supported');
  },
  listDependencies() {
    throw Error('Deno not supported');
  },
};
