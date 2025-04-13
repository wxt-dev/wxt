import { describe, it, expect, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { createCdpConnection, type CDPConnection } from '../cdp';
import { createBidiConnection, type BidiConnection } from '../bidi';
import type { ChildProcess } from 'node:child_process';
import { installChromium, installFirefox } from '../install';
import { aE } from 'vitest/dist/chunks/reporters.d.CfRkRKN2.js';

vi.mock('../cdp');
const createCdpConnectionMock = vi.mocked(createCdpConnection);

vi.mock('../bidi');
const createBidiConnectionMock = vi.mocked(createBidiConnection);

describe('Install', () => {
  describe('Chromium', () => {
    it('Should send the install command to the process', async () => {
      const browserProcess = mock<ChildProcess>();
      const connection = mock<CDPConnection>({
        [Symbol.dispose]: vi.fn(),
      });
      const extensionDir = '/path/to/extension';
      const expectedExtensionId = 'chromium-extension-id';

      createCdpConnectionMock.mockReturnValue(connection);
      connection.send.mockImplementation(async (method) => {
        if (method === 'Extensions.loadUnpacked')
          return { id: expectedExtensionId };
        throw Error('Unknown method');
      });

      const res = await installChromium(browserProcess, extensionDir);

      expect(createCdpConnectionMock).toBeCalledTimes(1);
      expect(createCdpConnectionMock).toBeCalledWith(browserProcess);

      expect(connection.send).toBeCalledTimes(1);
      expect(connection.send).toBeCalledWith('Extensions.loadUnpacked', {
        path: extensionDir,
      });

      expect(res).toEqual({ id: expectedExtensionId });
    });
  });

  describe('Firefox', () => {
    it('Should connect to the server, start a session, then install the extension', async () => {
      const debuggerUrl = 'http://127.0.0.1:9222';
      const extensionDir = '/path/to/extension';
      const expectedExtensionId = 'firefox-extension-id';
      const connection = mock<BidiConnection>({
        [Symbol.dispose]: vi.fn(),
      });

      createBidiConnectionMock.mockResolvedValue(connection);
      connection.send.mockImplementation(async (method) => {
        if (method === 'session.new') return { sessionId: 'session-id' };
        if (method === 'webExtension.install')
          return { extension: expectedExtensionId };
      });

      const res = await installFirefox(debuggerUrl, extensionDir);

      expect(createBidiConnectionMock).toBeCalledTimes(1);
      expect(createBidiConnectionMock).toBeCalledWith(debuggerUrl);

      expect(connection.send).toBeCalledTimes(2);
      expect(connection.send).toBeCalledWith('session.new', {
        capabilities: {},
      });
      expect(connection.send).toBeCalledWith('webExtension.install', {
        extensionData: {
          type: 'path',
          path: extensionDir,
        },
      });

      expect(res).toEqual({ extension: expectedExtensionId });
    });
  });
});
