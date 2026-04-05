import { TestProject } from '../../../wxt/e2e/utils.ts';
import { installFirefox } from '../../../runner/src';
import { createServer } from 'node:net';
import { type BrowserContext, firefox } from 'playwright';
import { expect } from 'vitest';

export function buildProject(
  contentSource: string,
  unlistedSource: string,
  browser: string,
  manifestVersion: 2 | 3,
) {
  const project = new TestProject();
  project.addFile('entrypoints/content.ts', contentSource);
  project.addFile('entrypoints/unlisted.ts', unlistedSource);
  project.setConfigFileConfig({
    manifest: {
      browser_specific_settings: {
        gecko: {
          id: 'test-content-script@wxt.dev',
        },
      },
      web_accessible_resources: [
        {
          resources: ['unlisted.js'],
          matches: ['*://*.google.com/*'],
        },
      ],
    },
  });

  return { project, build: project.build({ browser, manifestVersion }) };
}

export async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        server.close(() => resolve(addr.port));
      } else {
        server.close(() => reject(new Error('Failed to get free port')));
      }
    });
    server.on('error', reject);
  });
}

export async function launchFirefoxWithExtension(
  extensionPath: string,
): Promise<BrowserContext> {
  const port = await getFreePort();

  const context = await firefox.launchPersistentContext('', {
    args: [`--remote-debugging-port=${port}`],
  });

  // Retry installing extension via BiDi — the BiDi server may need a moment
  const maxRetries = 10;
  for (let i = 0; i < maxRetries; i++) {
    try {
      await installFirefox(`ws://127.0.0.1:${port}`, extensionPath);
      return context;
    } catch {
      if (i === maxRetries - 1) {
        await context.close();
        throw new Error(
          `Failed to install Firefox extension via BiDi after ${maxRetries} retries`,
        );
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return context;
}

export async function collectConsoleLogs(
  context: BrowserContext,
): Promise<string[]> {
  const consoleLogs: string[] = [];

  const page = context.pages()[0] || (await context.newPage());
  page.on('console', (msg) => consoleLogs.push(msg.text()));
  await page.goto('https://www.google.com', { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  return consoleLogs;
}
