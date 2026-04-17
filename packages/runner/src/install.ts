import type { ChildProcess } from 'node:child_process';
import { BidiConnection, createBidiConnection } from './bidi';
import { CDPConnection, createCdpConnection } from './cdp';

/**
 * Install an extension to an already running instance of Firefox.
 *
 * @param debuggerUrl The URL of the Firefox BiDi server (ex:
 *   `ws://127.0.0.1:45912`).
 * @param extensionDir Absolute path to the directory containing the extension
 *   to be installed.
 */
export async function installFirefox(
  bidi: BidiConnection,
  extensionDir: string,
): Promise<BidiWebExtensionInstallResponse> {
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
 * Given a child process of Chrome, install an extension. The process must be
 * started with the following flags:
 *
 * - `--remote-debugging-pipe`
 * - `--user-data-dir=...`
 * - `--enable-unsafe-extension-debugging`
 *
 * Otherwise it the CDP doesn't have permission to install extensions.
 */
export async function installChromium(
  cdp: CDPConnection,
  extensionDir: string,
): Promise<CdpExtensionsLoadUnpackedResponse> {
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
