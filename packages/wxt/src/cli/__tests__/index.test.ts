import consola, { LogLevels } from 'consola';
import { describe, it, vi, beforeEach, expect } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { build, createServer, zip, prepare, clean, initialize } from '../../';

vi.mock('../../build');
const buildMock = vi.mocked(build);

vi.mock('../../create-server');
const createServerMock = vi.mocked(createServer);

vi.mock('../../zip');
const zipMock = vi.mocked(zip);

vi.mock('../../prepare');
const prepareMock = vi.mocked(prepare);

vi.mock('../../clean');
const cleanMock = vi.mocked(clean);

vi.mock('../../initialize');
const initializeMock = vi.mocked(initialize);

consola.wrapConsole();

const ogArgv = process.argv;

function mockArgv(...args: string[]) {
  process.argv = ['/bin/node', 'bin/wxt.mjs', ...args];
}

async function importCli() {
  await import('..');
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
      await importCli();

      expect(createServerMock).toHaveBeenCalledWith({});
    });

    it('should respect passing a custom root', async () => {
      mockArgv('path/to/root');
      await importCli();

      expect(createServerMock).toHaveBeenCalledWith({
        root: 'path/to/root',
      });
    });

    it('should respect a custom config file', async () => {
      mockArgv('-c', './path/to/config.ts');
      await importCli();

      expect(createServerMock).toHaveBeenCalledWith({
        configFile: './path/to/config.ts',
      });
    });

    it('should respect passing a custom mode', async () => {
      mockArgv('-m', 'development');
      await importCli();

      expect(createServerMock).toHaveBeenCalledWith({
        mode: 'development',
      });
    });

    it('should respect passing a custom browser', async () => {
      mockArgv('-b', 'firefox');
      await importCli();

      expect(createServerMock).toHaveBeenCalledWith({
        browser: 'firefox',
      });
    });

    it('should pass correct filtered entrypoints', async () => {
      mockArgv('-e', 'popup', '-e', 'options');
      await importCli();

      expect(createServerMock).toHaveBeenCalledWith({
        filterEntrypoints: ['popup', 'options'],
      });
    });

    it('should respect passing --mv2', async () => {
      mockArgv('--mv2');
      await importCli();

      expect(createServerMock).toHaveBeenCalledWith({
        manifestVersion: 2,
      });
    });

    it('should respect passing --mv3', async () => {
      mockArgv('--mv3');
      await importCli();

      expect(createServerMock).toHaveBeenCalledWith({
        manifestVersion: 3,
      });
    });

    it('should respect passing --port', async () => {
      const expectedPort = 3100;
      mockArgv('--port', String(expectedPort));
      await importCli();

      expect(createServerMock).toHaveBeenCalledWith({
        dev: {
          server: {
            port: expectedPort,
          },
        },
      });
    });

    it('should respect passing --debug', async () => {
      mockArgv('--debug');
      await importCli();

      expect(createServerMock).toHaveBeenCalledWith({
        debug: true,
      });
      expect(consola.level).toBe(LogLevels.debug);
    });

    it('should set log --level', async () => {
      mockArgv('--level', 'warn');
      await importCli();

      expect(consola.level).toBe(LogLevels.warn);
    });

    it('--debug should override --level', async () => {
      mockArgv('--debug', '--level', 'silent');
      await importCli();

      expect(consola.level).toBe(LogLevels.debug);
    });
  });

  describe('build', () => {
    it('should not pass any config when no flags are passed', async () => {
      mockArgv('build');
      await importCli();

      expect(buildMock).toHaveBeenCalledWith({});
    });

    it('should respect passing a custom root', async () => {
      mockArgv('build', 'path/to/root');
      await importCli();

      expect(buildMock).toHaveBeenCalledWith({
        root: 'path/to/root',
      });
    });

    it('should respect a custom config file', async () => {
      mockArgv('build', '-c', './path/to/config.ts');
      await importCli();

      expect(buildMock).toHaveBeenCalledWith({
        configFile: './path/to/config.ts',
      });
    });

    it('should respect passing a custom mode', async () => {
      mockArgv('build', '-m', 'development');
      await importCli();

      expect(buildMock).toHaveBeenCalledWith({
        mode: 'development',
      });
    });

    it('should respect passing a custom browser', async () => {
      mockArgv('build', '-b', 'firefox');
      await importCli();

      expect(buildMock).toHaveBeenCalledWith({
        browser: 'firefox',
      });
    });

    it('should pass correct filtered entrypoints', async () => {
      mockArgv('build', '-e', 'popup', '-e', 'options');
      await importCli();

      expect(buildMock).toHaveBeenCalledWith({
        filterEntrypoints: ['popup', 'options'],
      });
    });

    it('should respect passing --mv2', async () => {
      mockArgv('build', '--mv2');
      await importCli();

      expect(buildMock).toHaveBeenCalledWith({
        manifestVersion: 2,
      });
    });

    it('should respect passing --mv3', async () => {
      mockArgv('build', '--mv3');
      await importCli();

      expect(buildMock).toHaveBeenCalledWith({
        manifestVersion: 3,
      });
    });

    it('should include analysis in the build', async () => {
      mockArgv('build', '--analyze');
      await importCli();

      expect(buildMock).toHaveBeenCalledWith({
        analysis: {
          enabled: true,
        },
      });
    });

    it('should respect passing --debug', async () => {
      mockArgv('build', '--debug');
      await importCli();

      expect(buildMock).toHaveBeenCalledWith({
        debug: true,
      });
      expect(consola.level).toBe(LogLevels.debug);
    });

    it('should set log --level', async () => {
      mockArgv('build', '--level', 'warn');
      await importCli();

      expect(consola.level).toBe(LogLevels.warn);
    });

    it('--debug should override --level', async () => {
      mockArgv('build', '--debug', '--level', 'silent');
      await importCli();

      expect(consola.level).toBe(LogLevels.debug);
    });
  });

  describe('zip', () => {
    it('should not pass any config when no flags are passed', async () => {
      mockArgv('zip');
      await importCli();

      expect(zipMock).toHaveBeenCalledWith({
        zip: {},
      });
    });

    it('should respect passing a custom root', async () => {
      mockArgv('zip', 'path/to/root');
      await importCli();

      expect(zipMock).toHaveBeenCalledWith({
        root: 'path/to/root',
        zip: {},
      });
    });

    it('should respect a custom config file', async () => {
      mockArgv('zip', '-c', './path/to/config.ts');
      await importCli();

      expect(zipMock).toHaveBeenCalledWith({
        configFile: './path/to/config.ts',
        zip: {},
      });
    });

    it('should respect passing a custom mode', async () => {
      mockArgv('zip', '-m', 'development');
      await importCli();

      expect(zipMock).toHaveBeenCalledWith({
        mode: 'development',
        zip: {},
      });
    });

    it('should respect passing a custom browser', async () => {
      mockArgv('zip', '-b', 'firefox');
      await importCli();

      expect(zipMock).toHaveBeenCalledWith({
        browser: 'firefox',
        zip: {},
      });
    });

    it('should respect passing --mv2', async () => {
      mockArgv('zip', '--mv2');
      await importCli();

      expect(zipMock).toHaveBeenCalledWith({
        manifestVersion: 2,
        zip: {},
      });
    });

    it('should respect passing --mv3', async () => {
      mockArgv('zip', '--mv3');
      await importCli();

      expect(zipMock).toHaveBeenCalledWith({
        manifestVersion: 3,
        zip: {},
      });
    });

    it('should respect passing --debug', async () => {
      mockArgv('zip', '--debug');
      await importCli();

      expect(zipMock).toHaveBeenCalledWith({
        debug: true,
        zip: {},
      });
      expect(consola.level).toBe(LogLevels.debug);
    });

    it('should set log --level', async () => {
      mockArgv('zip', '--level', 'warn');
      await importCli();

      expect(consola.level).toBe(LogLevels.warn);
    });

    it('--debug should override --level', async () => {
      mockArgv('zip', '--debug', '--level', 'silent');
      await importCli();

      expect(consola.level).toBe(LogLevels.debug);
    });

    it('should pass undefined for zipSources when --sources is not passed', async () => {
      mockArgv('zip');
      await importCli();

      expect(zipMock).toHaveBeenCalledWith({
        zip: {
          zipSources: undefined,
        },
      });
    });

    it('should pass true for zipSources when --sources is passed', async () => {
      mockArgv('zip', '--sources');
      await importCli();

      expect(zipMock).toHaveBeenCalledWith({
        zip: {
          zipSources: true,
        },
      });
    });

    it('should pass false for zipSources when --sources=false is passed', async () => {
      mockArgv('zip', '--sources=false');
      await importCli();

      expect(zipMock).toHaveBeenCalledWith({
        zip: {
          zipSources: false,
        },
      });
    });
  });

  describe('prepare', () => {
    it('should not pass any config when no flags are passed', async () => {
      mockArgv('prepare');
      await importCli();

      expect(prepareMock).toHaveBeenCalledWith({});
    });

    it('should respect passing a custom root', async () => {
      mockArgv('prepare', 'path/to/root');
      await importCli();

      expect(prepareMock).toHaveBeenCalledWith({
        root: 'path/to/root',
      });
    });

    it('should respect a custom config file', async () => {
      mockArgv('prepare', '-c', './path/to/config.ts');
      await importCli();

      expect(prepareMock).toHaveBeenCalledWith({
        configFile: './path/to/config.ts',
      });
    });

    it('should respect passing --debug', async () => {
      mockArgv('prepare', '--debug');
      await importCli();

      expect(prepareMock).toHaveBeenCalledWith({
        debug: true,
      });
      expect(consola.level).toBe(LogLevels.debug);
    });

    it('should set log --level', async () => {
      mockArgv('prepare', '--level', 'warn');
      await importCli();

      expect(consola.level).toBe(LogLevels.warn);
    });

    it('--debug should override --level', async () => {
      mockArgv('prepare', '--debug', '--level', 'silent');
      await importCli();

      expect(consola.level).toBe(LogLevels.debug);
    });
  });

  describe('clean', () => {
    it('should not pass any config when no flags are passed', async () => {
      mockArgv('clean');
      await importCli();

      expect(cleanMock).toHaveBeenCalledWith({});
    });

    it('should respect passing a custom root', async () => {
      mockArgv('clean', 'path/to/root');
      await importCli();

      expect(cleanMock).toHaveBeenCalledWith({ root: 'path/to/root' });
    });

    it('should respect a custom config file', async () => {
      mockArgv('clean', '-c', './path/to/config.ts');
      await importCli();

      expect(cleanMock).toHaveBeenCalledWith({
        configFile: './path/to/config.ts',
      });
    });

    it('should respect passing --debug', async () => {
      mockArgv('clean', '--debug');
      await importCli();

      expect(cleanMock).toHaveBeenCalledWith({
        debug: true,
      });
      expect(consola.level).toBe(LogLevels.debug);
    });

    it('should set log --level', async () => {
      mockArgv('clean', '--level', 'warn');
      await importCli();

      expect(consola.level).toBe(LogLevels.warn);
    });

    it('--debug should override --level', async () => {
      mockArgv('clean', '--debug', '--level', 'silent');
      await importCli();

      expect(consola.level).toBe(LogLevels.debug);
    });
  });

  describe('init', () => {
    it('should not pass any options when no flags are passed', async () => {
      mockArgv('init');
      await importCli();

      expect(initializeMock).toHaveBeenCalledWith(expect.objectContaining({}));
    });

    it('should respect the provided folder', async () => {
      mockArgv('init', 'path/to/folder');
      await importCli();

      expect(initializeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          directory: 'path/to/folder',
        }),
      );
    });

    it('should respect passing --template', async () => {
      mockArgv('init', '-t', 'vue');
      await importCli();

      expect(initializeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          template: 'vue',
        }),
      );
    });

    it('should respect passing --pm', async () => {
      mockArgv('init', '--pm', 'pnpm');
      await importCli();

      expect(initializeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          packageManager: 'pnpm',
        }),
      );
    });

    it('should respect passing --git', async () => {
      mockArgv('init', '--git');
      await importCli();

      expect(initializeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          requireGit: true,
        }),
      );
    });
  });
});
