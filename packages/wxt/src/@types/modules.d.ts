// Custom TS definitions for non-TS packages

declare module 'zip-dir' {
  // Represents the options object for zipdir function
  interface ZipDirOptions {
    saveTo?: string;
    filter?: (path: string, stat: import('fs').Stats) => boolean;
    each?: (path: string) => void;
  }

  function zipdir(
    dirPath: string,
    options?: ZipDirOptions,
    callback?: (error: Error | null, buffer: Buffer) => void,
  ): Promise<Buffer>;

  export = zipdir;
}
