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

  if (
    resolvedOptions.target.includes('firefox') ||
    resolvedOptions.target.includes('zen')
  ) {
    return runFirefox(resolvedOptions);
  } else {
    return runChromium(resolvedOptions);
  }
}

async function runFirefox(options: ResolvedRunOptions): Promise<Runner> {
  const urlRes = promiseWithResolvers<string>();
  const urlTimeout = setTimeout(() => {
    urlRes.reject(Error('Timed out after 10s waiting for the browser to open'));
  }, 10e3);

  // Firefox notifies the user if an instance is already running, so we don't add any logs for it.

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

  const opened = promiseWithResolvers<void>();
  const openedTimeout = setTimeout(() => {
    opened.reject(Error('Timed out after 10s waiting for browser to open.'));
  }, 10e3);

  const debugChromeStderr = debugChrome.scoped('stderr');
  browserProcess.stderr!.on('data', (data: string) => {
    const message = data.toString().trim();
    debugChromeStderr(message);

    // This message signifies Chrome started up correctly.
    if (message.startsWith('DevTools listening on')) {
      clearTimeout(openedTimeout);
      opened.resolve();
    }
  });
  const debugChromeStdout = debugChrome.scoped('stdout');
  browserProcess.stdout!.on('data', (data: string) => {
    const message = data.toString().trim();
    debugChromeStdout(message);

    // This message signifies Chrome was already open, and thus we couldn't open the required new instance.
    if (message === 'Opening in existing browser session.') {
      clearTimeout(openedTimeout);
      opened.reject(
        Error(
          'An instance of the browser is already running. Close it and try again.',
        ),
      );
    }
  });

  // Wait for the browser to open before proceeding.
  await opened.promise;

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
