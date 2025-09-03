import type { ChildProcess } from 'node:child_process';
import { createBidiConnection } from './bidi';
import { createCdpConnection } from './cdp';

/**
 * Install an extension to an already running instance of Firefox.
 * @param debuggerUrl The URL of the Firefox BiDi server (ex: `ws://127.0.0.1:45912`).
 * @param extensionDir Absolute path to the directory containing the extension to be installed.
 */
export async function installFirefox(
  debuggerUrl: string,
  extensionDir: string,
): Promise<BidiWebExtensionInstallResponse> {
  using bidi = await createBidiConnection(debuggerUrl);

  // Start a session
  await bidi.send<unknown>('session.new', { capabilities: {} });

  // Install the extension
  return await bidi.send<BidiWebExtensionInstallResponse>(
    'webExtension.install',
    {
      extensionData: {
        type: 'path',
        path: extensionDir,
      },
    },
  );
}

export type BidiWebExtensionInstallResponse = {
  extension: string;
};

/**
 * Given a child process of Chrome, install an extension. The process must be started with the following flags:
 *
 * - `--remote-debugging-pipe`
 * - `--user-data-dir=...`
 * - `--enable-unsafe-extension-debugging`
 *
 * Otherwise it the CDP doesn't have permission to install extensions.
 */
export async function installChromium(
  browserProcess: ChildProcess,
  extensionDir: string,
): Promise<CdpExtensionsLoadUnpackedResponse> {
  using cdp = createCdpConnection(browserProcess);
  return await cdp.send<CdpExtensionsLoadUnpackedResponse>(
    'Extensions.loadUnpacked',
    {
      path: extensionDir,
    },
  );
}

export type CdpExtensionsLoadUnpackedResponse = {
  id: string;
};
