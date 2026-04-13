import { describe, it, expect } from 'vitest';
import { TestProject } from '../utils';
import { createServer as createNetServer } from 'node:net';

/** Starts a TCP server on the given port and returns a cleanup function. */
function occupyPort(port: number): Promise<() => Promise<void>> {
  return new Promise((resolve, reject) => {
    const srv = createNetServer();
    srv.listen(port, 'localhost', () => {
      resolve(() => new Promise<void>((res) => srv.close(() => res())));
    });
    srv.on('error', reject);
  });
}

describe('Dev Mode', () => {
  it('should not change ports when restarting the server', async () => {
    const project = new TestProject();
    project.addFile(
      'entrypoints/background.ts',
      'export default defineBackground(() => {})',
    );

    const server = await project.startServer({
      runner: {
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
      runner: { disabled: true },
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
      runner: { disabled: true },
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
          runner: { disabled: true },
          dev: { server: { port, strictPort: true } },
        }),
      ).rejects.toThrow();
    } finally {
      await freePort();
    }
  });
});
