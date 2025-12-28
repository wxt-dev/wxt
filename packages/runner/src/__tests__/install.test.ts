import { describe, it, expect, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { createCdpConnection, type CDPConnection } from '../cdp';
import { createBidiConnection, type BidiConnection } from '../bidi';
import type { ChildProcess } from 'node:child_process';
import { installChromium, installFirefox } from '../install';

vi.mock('../cdp');
const createCdpConnectionMock = vi.mocked(createCdpConnection);

vi.mock('../bidi');
const createBidiConnectionMock = vi.mocked(createBidiConnection);

describe('Install', () => {
  describe('Chromium', () => {
    it('Should send the install command to the process', async () => {
      const EXTENSION_DIR = '/path/to/extension';
      const EXPECTED_EXTENSION_ID = 'chromium-extension-id';

      const browserProcess = mock<ChildProcess>();
      const connection = mock<CDPConnection>({
        [Symbol.dispose]: vi.fn(),
      });

      createCdpConnectionMock.mockReturnValue(connection);
      connection.send.mockImplementation(async (method) => {
        if (method === 'Extensions.loadUnpacked') {
          return { id: EXPECTED_EXTENSION_ID };
        }

        throw Error('Unknown method');
      });

      const res = await installChromium(browserProcess, EXTENSION_DIR);

      expect(createCdpConnectionMock).toBeCalledTimes(1);
      expect(createCdpConnectionMock).toBeCalledWith(browserProcess);

      expect(connection.send).toBeCalledTimes(1);
      expect(connection.send).toBeCalledWith('Extensions.loadUnpacked', {
        path: EXTENSION_DIR,
      });

      expect(res).toEqual({ id: EXPECTED_EXTENSION_ID });
    });
  });

  describe('Firefox', () => {
    it('Should connect to the server, start a session, then install the extension', async () => {
      const DEBUGGER_URL = 'http://127.0.0.1:9222';
      const EXTENSION_DIR = '/path/to/extension';
      const EXPECTED_EXTENSION_ID = 'firefox-extension-id';

      const connection = mock<BidiConnection>({
        [Symbol.dispose]: vi.fn(),
      });

      createBidiConnectionMock.mockResolvedValue(connection);
      connection.send.mockImplementation(async (method) => {
        if (method === 'session.new') {
          return { sessionId: 'session-id' };
        }

        if (method === 'webExtension.install') {
          return { extension: EXPECTED_EXTENSION_ID };
        }
      });

      const res = await installFirefox(DEBUGGER_URL, EXTENSION_DIR);

      expect(createBidiConnectionMock).toBeCalledTimes(1);
      expect(createBidiConnectionMock).toBeCalledWith(DEBUGGER_URL);

      expect(connection.send).toBeCalledTimes(2);
      expect(connection.send).toBeCalledWith('session.new', {
        capabilities: {},
      });
      expect(connection.send).toBeCalledWith('webExtension.install', {
        extensionData: {
          type: 'path',
          path: EXTENSION_DIR,
        },
      });

      expect(res).toEqual({ extension: EXPECTED_EXTENSION_ID });
    });
  });
});
