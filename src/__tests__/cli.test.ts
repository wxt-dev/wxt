import { describe, it, vi, beforeEach, expect } from 'vitest';
import { build } from '../core/build';
import { createServer } from '../core/create-server';
import { mock } from 'vitest-mock-extended';
import consola from 'consola';

vi.mock('../core/build');
const buildMock = vi.mocked(build);

vi.mock('../core/create-server');
const createServerMock = vi.mocked(createServer);

consola.wrapConsole();

const ogArgv = process.argv;

function mockArgv(...args: string[]) {
  process.argv = ['/bin/node', 'bin/wxt.mjs', ...args];
}

describe('CLI', () => {
  beforeEach(() => {
    vi.resetModules();
    process.argv = ogArgv;
    createServerMock.mockResolvedValue(mock());
  });

  describe('dev', () => {
    it('should not pass any config when no flags are passed', async () => {
      mockArgv();
      await import('../cli');

      expect(createServerMock).toBeCalledWith({});
    });

    it('should respect passing a custom root', async () => {
      mockArgv('path/to/root');
      await import('../cli');

      expect(createServerMock).toBeCalledWith({
        root: 'path/to/root',
      });
    });

    it('should respect a custom config file', async () => {
      mockArgv('-c', './path/to/config.ts');
      await import('../cli');

      expect(createServerMock).toBeCalledWith({
        configFile: './path/to/config.ts',
      });
    });

    it('should respect passing a custom mode', async () => {
      mockArgv('-m', 'development');
      await import('../cli');

      expect(createServerMock).toBeCalledWith({
        mode: 'development',
      });
    });

    it('should respect passing a custom browser', async () => {
      mockArgv('-b', 'firefox');
      await import('../cli');

      expect(createServerMock).toBeCalledWith({
        browser: 'firefox',
      });
    });

    it('should pass correct filtered entrypoints', async () => {
      mockArgv('-e', 'popup', '-e', 'options');
      await import('../cli');

      expect(createServerMock).toBeCalledWith({
        filterEntrypoints: ['popup', 'options'],
      });
    });

    it('should respect passing --mv2', async () => {
      mockArgv('--mv2');
      await import('../cli');

      expect(createServerMock).toBeCalledWith({
        manifestVersion: 2,
      });
    });

    it('should respect passing --mv3', async () => {
      mockArgv('--mv3');
      await import('../cli');

      expect(createServerMock).toBeCalledWith({
        manifestVersion: 3,
      });
    });

    it('should respect passing --debug', async () => {
      mockArgv('--debug');
      await import('../cli');

      expect(createServerMock).toBeCalledWith({
        debug: true,
      });
    });
  });

  describe('build', () => {
    it('should not pass any config when no flags are passed', async () => {
      mockArgv('build');
      await import('../cli');

      expect(buildMock).toBeCalledWith({});
    });

    it('should respect passing a custom root', async () => {
      mockArgv('build', 'path/to/root');
      await import('../cli');

      expect(buildMock).toBeCalledWith({
        root: 'path/to/root',
      });
    });

    it('should respect a custom config file', async () => {
      mockArgv('build', '-c', './path/to/config.ts');
      await import('../cli');

      expect(buildMock).toBeCalledWith({
        configFile: './path/to/config.ts',
      });
    });

    it('should respect passing a custom mode', async () => {
      mockArgv('build', '-m', 'development');
      await import('../cli');

      expect(buildMock).toBeCalledWith({
        mode: 'development',
      });
    });

    it('should respect passing a custom browser', async () => {
      mockArgv('build', '-b', 'firefox');
      await import('../cli');

      expect(buildMock).toBeCalledWith({
        browser: 'firefox',
      });
    });

    it('should pass correct filtered entrypoints', async () => {
      mockArgv('build', '-e', 'popup', '-e', 'options');
      await import('../cli');

      expect(buildMock).toBeCalledWith({
        filterEntrypoints: ['popup', 'options'],
      });
    });

    it('should respect passing --mv2', async () => {
      mockArgv('build', '--mv2');
      await import('../cli');

      expect(buildMock).toBeCalledWith({
        manifestVersion: 2,
      });
    });

    it('should respect passing --mv3', async () => {
      mockArgv('build', '--mv3');
      await import('../cli');

      expect(buildMock).toBeCalledWith({
        manifestVersion: 3,
      });
    });

    it('should include analysis in the build', async () => {
      mockArgv('build', '--analyze');
      await import('../cli');

      expect(buildMock).toBeCalledWith({
        analysis: {
          enabled: true,
        },
      });
    });

    it('should respect passing --debug', async () => {
      mockArgv('build', '--debug');
      await import('../cli');

      expect(buildMock).toBeCalledWith({
        debug: true,
      });
    });
  });
});
