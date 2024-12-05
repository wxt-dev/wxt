import { describe, it, expect } from 'vitest';
import { TestProject } from '../utils';

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
});
