import { PackageManager } from 'nypm';

export interface WxtPackageManager extends PackageManager {
  getAllDependencies(): Promise<PackageInfo[]>;
}

export interface PackageInfo {
  name: string;
  version: string;
  url?: string;
}
