import { EventEmitter } from 'node:events';
import readline from 'node:readline';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { WxtDevServer } from '../../types';
import { createKeyboardShortcuts } from '../keyboard-shortcuts';

vi.mock('node:readline', () => ({
  default: {
    createInterface: vi.fn(),
  },
}));

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

    createKeyboardShortcuts(mock<WxtDevServer>()).start();

    expect(readline.createInterface).not.toHaveBeenCalled();
  });

  it('should reopen the browser when o is entered in an interactive terminal', () => {
    Object.defineProperty(process.stdin, 'isTTY', {
      configurable: true,
      value: true,
    });
    const input = new EventEmitter();
    vi.mocked(readline.createInterface).mockReturnValue(
      input as readline.Interface,
    );
    const server = mock<WxtDevServer>();

    createKeyboardShortcuts(server).start();
    input.emit('line', 'o');

    expect(readline.createInterface).toHaveBeenCalledWith({
      input: process.stdin,
      terminal: false,
    });
    expect(server.restartBrowser).toHaveBeenCalledOnce();
  });
});
