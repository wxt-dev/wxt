import { debug } from './debug';
import {
  resolveRunOptions,
  type ResolvedRunOptions,
  type RunOptions,
} from './options';
import { spawn } from 'node:child_process';
import { createCdpConnection } from './cdp';
import { installFirefox } from './install';
import { promiseWithResolvers } from './promises';

const debugFirefox = debug.scoped('firefox');
const debugChrome = debug.scoped('chrome');

export interface Runner {
  stop(): void;
}

export async function run(options: RunOptions): Promise<Runner> {
  const resolvedOptions = await resolveRunOptions(options);

  switch (resolvedOptions.target) {
    case 'firefox':
      return runFirefox(resolvedOptions);
    case 'chromium':
      return runChromium(resolvedOptions);
    default:
      throw new Error(
        `Unsupported target: "${resolvedOptions.target}". Must be "firefox" or "chromium"`,
      );
  }
}

async function runFirefox(options: ResolvedRunOptions): Promise<Runner> {
  const urlRes = promiseWithResolvers<string>();
  const urlTimeout = setTimeout(() => {
    urlRes.reject(Error('Timed out after 10s waiting for Firefox to start'));
  }, 10e3);

  const browserProcess = spawn(
    `"${options.browserBinary}"`,
    options.firefoxArgs,
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    },
  );
  const debugFirefoxStderr = debugFirefox.scoped('stderr');
  browserProcess.stderr.on('data', (data: string) => {
    const message = data.toString().trim();
    debugFirefoxStderr(message);

    if (message.startsWith('WebDriver BiDi listening on ws://')) {
      clearTimeout(urlTimeout);
      urlRes.resolve(message.slice(28));
    }
  });
  const debugFirefoxStdout = debugFirefox.scoped('stdout');
  browserProcess.stdout.on('data', (data: string) => {
    const message = data.toString().trim();
    debugFirefoxStdout(message);
  });

  const baseUrl = await urlRes.promise;
  await installFirefox(baseUrl, options.extensionDir);

  return {
    stop() {
      browserProcess.kill('SIGINT');
    },
  };
}

async function runChromium(options: ResolvedRunOptions): Promise<Runner> {
  const browserProcess = spawn(
    `"${options.browserBinary}"`,
    options.chromiumArgs,
    {
      stdio: ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'],
      shell: true,
    },
  );

  const debugChromeStderr = debugChrome.scoped('stderr');
  browserProcess.stderr!.on('data', (data: string) => {
    const message = data.toString().trim();
    debugChromeStderr(message);
  });
  const debugChromeStdout = debugFirefox.scoped('stdout');
  browserProcess.stdout!.on('data', (data: string) => {
    const message = data.toString().trim();
    debugChromeStdout(message);
  });

  using cdp = createCdpConnection(browserProcess);
  await cdp.send<{ id: string }>('Extensions.loadUnpacked', {
    path: options.extensionDir,
  });

  return {
    stop() {
      browserProcess.kill('SIGINT');
    },
  };
}
