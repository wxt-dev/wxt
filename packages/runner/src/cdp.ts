import type { ChildProcess } from 'node:child_process';
import type { Readable, Writable } from 'node:stream';
import { debug } from './debug';

const debugCdp = debug.scoped('cdp');

export interface CDPConnection {
  send<T>(method: string, params: any, timeout?: number): Promise<T>;
  close(): void;
}

export function createCdpConnection(
  browserProcess: ChildProcess,
): CDPConnection {
  const inputStream = browserProcess.stdio[3] as Writable;
  const outputStream = browserProcess.stdio[4] as Readable;

  let requestId = 0;

  return {
    send(method, params, timeout = 10e3) {
      const id = ++requestId;
      const command = { id, method, params };
      debugCdp('Sending command:', command);

      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`CDP command timed out: ${method}`));
        }, timeout);

        const onData = (data: Buffer) => {
          // Trim the trailing null character
          const text = data.toString().slice(0, -1);
          const res = JSON.parse(text);

          if (res.id !== id) return;

          debugCdp('Received response:', res);
          clearTimeout(timer);
          outputStream.removeListener('data', onData);

          if ('error' in res) {
            reject(new Error(res.error.message, { cause: res.error }));
          } else {
            resolve(res.result);
          }
        };

        outputStream.addListener('data', onData);

        inputStream.write(JSON.stringify(command) + '\0');
      });
    },
    close() {},
    [Symbol.dispose]() {},
  };
}
