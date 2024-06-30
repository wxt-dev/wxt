export interface Example {
  name: string;
  description?: string;
  url: string;
  searchText: string;
  apis: string[];
  permissions: string[];
  packages: string[];
}

export type ExamplesMetadata = {
  examples: Example[];
  allApis: string[];
  allPermissions: string[];
  allPackages: string[];
};

export type KeySelectedObject = Record<string, boolean | undefined>;
