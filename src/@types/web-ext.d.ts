declare module 'web-ext' {
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

declare module 'web-ext/util/logger' {
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
