// Custom TS definitions for non-TS packages

declare module 'web-ext-run' {
  export interface WebExtRunInstance {
    reloadAllExtensions(): Promise<void>;
    exit(): Promise<void>;
  }

  const webExt: {
    cmd: {
      run(config: any, executeOptions: any): Promise<WebExtRunInstance>;
    };
  };
  export default webExt;
}

declare module 'web-ext-run/util/logger' {
  // https://github.com/mozilla/web-ext/blob/e37e60a2738478f512f1255c537133321f301771/src/util/logger.js#L43
  export interface IConsoleStream {
    stopCapturing(): void;
    startCapturing(): void;
    write(packet: Packet, options: unknown): void;
    flushCapturedLogs(options: unknown): void;
  }
  export interface Packet {
    name: string;
    msg: string;
    level: number;
  }
  export class ConsoleStream implements IConsoleStream {
    constructor(options?: { verbose: false });
  }
  export const consoleStream: IConsoleStream;
}

declare module 'wxt/browser' {
  // Overridden when types are generated per project
  export type PublicPath = string;
}
