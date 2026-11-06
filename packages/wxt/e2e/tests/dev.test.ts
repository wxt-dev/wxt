import { describe, expect, it } from 'vitest';
import { TestProject, occupyPort } from '../utils';

describe('Dev Mode', () => {
  it('should not change ports when restarting the server', async () => {
    const project = new TestProject();
    project.addFile(
      'entrypoints/background.ts',
      'export default defineBackground(() => {})',
    );

    const server = await project.startServer({
      webExt: {
        disabled: true,
      },
    });
    const initialPort = server.port;
    await server.restart();
    const finalPort = server.port;
    await server.stop();

    expect(finalPort).toBe(initialPort);
  });

  it('should use the specified port when it is available', async () => {
    const project = new TestProject();
    project.addFile(
      'entrypoints/background.ts',
      'export default defineBackground(() => {})',
    );

    const server = await project.startServer({
      webExt: { disabled: true },
      dev: { server: { port: 4400 } },
    });
    try {
      expect(server.port).toBe(4400);
    } finally {
      await server.stop();
    }
  });

  it('should fall back to the next available port by default when the port is occupied', async () => {
    const port = 4500;
    const freePort = await occupyPort(port);

    const project = new TestProject();
    project.addFile(
      'entrypoints/background.ts',
      'export default defineBackground(() => {})',
    );

    const server = await project.startServer({
      webExt: { disabled: true },
      dev: { server: { port } },
    });
    try {
      expect(server.port).not.toBe(port);
      expect(server.port).toBeGreaterThan(port);
    } finally {
      await server.stop();
      await freePort();
    }
  });

  it('should throw an error when strictPort is true and the port is occupied', async () => {
    const port = 4600;
    const freePort = await occupyPort(port);

    const project = new TestProject();
    project.addFile(
      'entrypoints/background.ts',
      'export default defineBackground(() => {})',
    );

    try {
      await expect(
        project.startServer({
          webExt: { disabled: true },
          dev: { server: { port, strictPort: true } },
        }),
      ).rejects.toThrow();
    } finally {
      await freePort();
    }
  });

  it.each(['firefox', 'safari'])(
    'should leave Vite worker URLs unchanged for %s extension pages',
    async (browser) => {
      const project = TestProject.simple();
      project.addFile('worker.ts', 'self.postMessage("ready")');

      const server = await project.startServer({
        browser,
        webExt: { disabled: true },
      });
      try {
        const response = await fetch(`${server.origin}/worker.ts?worker`);
        expect(response.ok).toBe(true);
        const code = await response.text();

        expect(code).toContain(
          `${server.origin}/worker.ts?worker_file&type=module`,
        );
        expect(code).not.toContain('URL.createObjectURL');
      } finally {
        await server.stop();
      }
    },
  );

  it('should use same-origin blob URLs for Vite workers in Chromium extension pages', async () => {
    const project = TestProject.simple();
    project.addFile('worker.ts', 'self.postMessage("ready")');

    const server = await project.startServer({
      webExt: { disabled: true },
    });
    const loadWorkerModule = async (query: string) => {
      const response = await fetch(`${server.origin}/worker.ts${query}`);
      expect(response.ok).toBe(true);
      return await response.text();
    };

    try {
      const workerConstructorModule = await loadWorkerModule('?worker');
      const inlineWorkerModule = await loadWorkerModule('?worker&inline');
      const workerUrlModule = await loadWorkerModule('?worker&url');
      const workerUrl = `${server.origin}/worker.ts?worker_file&type=module`;
      const workerConstructorScript = `URL.revokeObjectURL(self.location.href);import ${JSON.stringify(workerUrl)};`;

      for (const code of [workerConstructorModule, inlineWorkerModule]) {
        expect(code).toContain(JSON.stringify(workerConstructorScript));
      }
      expect(workerUrlModule).toContain('__wxtBufferMessage');
      expect(workerUrlModule).toContain(workerUrl);
      expect(workerUrlModule).not.toContain('URL.revokeObjectURL');
      for (const code of [
        workerConstructorModule,
        inlineWorkerModule,
        workerUrlModule,
      ]) {
        expect(code).toContain('URL.createObjectURL(new Blob');
      }
      expect(workerConstructorModule).not.toMatch(
        /new Worker\(\s*"http:\/\/localhost:/,
      );
      expect(workerUrlModule).not.toMatch(
        /export default "http:\/\/localhost:/,
      );
    } finally {
      await server.stop();
    }
  });
});
