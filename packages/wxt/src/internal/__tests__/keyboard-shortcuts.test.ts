import { afterAll, afterEach, describe, expect, it, mock, vi } from 'bun:test';
import { EventEmitter } from 'node:events';
import readline from 'node:readline';

import { mock as mockOf, mocked } from '../../internal-utils/testing/mock';
import type { WxtDevServer } from '../../types';
import { createKeyboardShortcuts } from '../keyboard-shortcuts';

const actualReadline = await import('node:readline');
mock.module('node:readline', () => ({
  default: {
    createInterface: vi.fn(),
  },
}));

afterAll(() => {
  mock.module('node:readline', () => actualReadline);
});

const originalIsTTY = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');

describe('createKeyboardShortcuts', () => {
  afterEach(() => {
    if (originalIsTTY) {
      Object.defineProperty(process.stdin, 'isTTY', originalIsTTY);
    } else {
      delete (process.stdin as Partial<NodeJS.ReadStream>).isTTY;
    }
  });

  it('should not initialize stdin shortcuts when stdin is non-interactive', () => {
    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      value: undefined,
    });

    createKeyboardShortcuts(mockOf<WxtDevServer>()).start();

    expect(readline.createInterface).not.toHaveBeenCalled();
  });

  it('should reopen the browser when o is entered in an interactive terminal', () => {
    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      value: true,
    });
    const input = new EventEmitter();
    mocked(readline.createInterface).mockReturnValue(
      input as readline.Interface,
    );
    const server = mockOf<WxtDevServer>();

    createKeyboardShortcuts(server).start();
    input.emit('line', 'o');

    expect(readline.createInterface).toHaveBeenCalledWith({
      input: process.stdin,
      terminal: false,
    });
    expect(server.restartBrowser).toHaveBeenCalledOnce();
  });
});
