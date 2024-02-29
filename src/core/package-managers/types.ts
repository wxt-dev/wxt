import { WxtPackageManager } from '~/types';

export type WxtPackageManagerImpl = Pick<
  WxtPackageManager,
  'downloadDependency' | 'listDependencies'
>;
