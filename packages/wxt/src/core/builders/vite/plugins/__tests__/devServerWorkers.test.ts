import { describe, expect, it } from 'vitest';
import { replaceDevServerWorkerUrl } from '../devServerWorkers';

const devServerOrigin = 'http://localhost:3000';
const workerUrl = `${devServerOrigin}/worker.ts?worker_file&type=module`;

describe('Dev Server Workers Plugin', () => {
  it('should replace constructor worker URLs with self-revoking blob URLs', () => {
    const code = `export default function WorkerWrapper(options) {
      return new Worker(${JSON.stringify(workerUrl)}, {
        type: "module",
        name: options?.name
      });
    }`;

    const actual = replaceDevServerWorkerUrl(code, devServerOrigin, true);

    expect(actual).toContain('URL.createObjectURL(new Blob');
    expect(actual).toContain(
      JSON.stringify(
        `URL.revokeObjectURL(self.location.href);import ${JSON.stringify(workerUrl)};`,
      ),
    );
    expect(actual).toContain('type: "module"');
    expect(actual).not.toContain(`new Worker(${JSON.stringify(workerUrl)}`);
  });

  it('should keep imported worker URL blobs reusable', () => {
    const code = `export default ${JSON.stringify(workerUrl)}`;

    const actual = replaceDevServerWorkerUrl(code, devServerOrigin, false);

    expect(actual).toContain('URL.createObjectURL(new Blob');
    expect(actual).toContain('__wxtBufferMessage');
    expect(actual).toContain('event.stopImmediatePropagation()');
    expect(actual).toContain(workerUrl);
    expect(actual).not.toContain('URL.revokeObjectURL');
    expect(actual).not.toContain(`export default ${JSON.stringify(workerUrl)}`);
  });

  it('should only replace the generated worker URL expression', () => {
    const code = `const unrelated = ${JSON.stringify(workerUrl)};\nexport default ${JSON.stringify(workerUrl)}`;

    const actual = replaceDevServerWorkerUrl(code, devServerOrigin, false);

    expect(actual).toContain(`const unrelated = ${JSON.stringify(workerUrl)}`);
    expect(actual).not.toContain(`export default ${JSON.stringify(workerUrl)}`);
    expect(replaceDevServerWorkerUrl(actual, devServerOrigin, false)).toBe(
      actual,
    );
  });

  it.each([
    'https://example.com/worker.ts?worker_file&type=module',
    `${devServerOrigin}/worker.ts`,
    'http://127.0.0.1:3000/worker.ts?worker_file&type=module',
  ])('should ignore non-dev-server worker URL %s', (url) => {
    const code = `export default ${JSON.stringify(url)}`;

    expect(replaceDevServerWorkerUrl(code, devServerOrigin, false)).toBe(code);
  });
});
