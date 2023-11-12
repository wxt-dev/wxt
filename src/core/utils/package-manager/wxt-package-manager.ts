import { PackageManager } from 'nypm';

export interface WxtPackageManager extends PackageManager {
  getAllDependencies(): Promise<PackageInfo[]>;
  addResolutions(
    packageJson: any,
    entries: Array<{ name: string; value: string }>,
  ): void;
}

export interface PackageInfo {
  name: string;
  version: string;
  url?: string;
}
