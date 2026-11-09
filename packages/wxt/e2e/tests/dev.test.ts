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

  it('should keep module auto-import presets after restarting the server', async () => {
    const project = new TestProject();
    project.addFile(
      'entrypoints/popup/index.html',
      `<!doctype html>
       <html>
         <body>
           <script type="module" src="./main.ts"></script>
         </body>
       </html>`,
    );
    project.addFile(
      'entrypoints/popup/main.ts',
      `const count = ref(0);
       console.log(count);`,
    );
    project.addFile(
      'modules/test.ts',
      `import { defineWxtModule, addImportPreset } from 'wxt/modules';

       export default defineWxtModule((wxt) => {
         addImportPreset(wxt, 'vue');
       });`,
    );

    const server = await project.startServer({
      webExt: { disabled: true },
      vite: () => ({
        build: {
          target: 'esnext',
        },
        // Keep dep discovery off so the e2e doesn't hang resolving `vue`.
        optimizeDeps: {
          noDiscovery: true,
          include: [],
        },
      }),
    });

    const assertVueAutoImportInjected = async (label: string) => {
      const response = await fetch(
        `${server.origin}/entrypoints/popup/main.ts?t=${Date.now()}`,
      );
      expect(response.ok, `${label}: response not ok`).toBe(true);
      const code = await response.text();
      // Vite may rewrite `from 'vue'` to a resolved `/@fs/.../vue...` path.
      expect(
        code,
        `${label}: missing vue auto-import injection\n${code}`,
      ).toMatch(
        /import\s*\{[^}]*\bref\b[^}]*\}\s*from\s*["'][^"']*vue[^"']*["']/,
      );
    };

    try {
      await assertVueAutoImportInjected('before restart');
      await server.restart();
      await assertVueAutoImportInjected('after restart');
    } finally {
      await server.stop();
    }
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
});
