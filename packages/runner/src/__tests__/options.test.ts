import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResolvedRunOptions, resolveRunOptions } from '../options';
import { resolve, join } from 'node:path';
import { tmpdir, homedir } from 'node:os';

vi.mock('node:os');
const tmpdirMock = vi.mocked(tmpdir);
const homedirMock = vi.mocked(homedir);

const homeDir = '~';
const tmpDir = '/tmp';

describe('Options', () => {
  beforeEach(() => {
    homedirMock.mockReturnValue(homeDir);
    tmpdirMock.mockReturnValue(tmpDir);
  });

  describe('extensionDir', () => {
    it('should default to the current working directory', async () => {
      const actual = await resolveRunOptions({});
      expect(actual).toMatchObject<Partial<ResolvedRunOptions>>({
        extensionDir: process.cwd(),
      });
    });

    it('should resolve relative to the current working directory', async () => {
      const actual = await resolveRunOptions({
        extensionDir: './path/to/extension',
      });
      expect(actual).toMatchObject<Partial<ResolvedRunOptions>>({
        extensionDir: resolve(process.cwd(), './path/to/extension'),
      });
    });
  });

  describe('target', () => {
    it('should be "chrome" by default', async () => {
      const actual = await resolveRunOptions({
        extensionDir: 'path/to/extension',
      });
      expect(actual).toMatchObject<Partial<ResolvedRunOptions>>({
        target: 'chrome',
      });
    });

    it('should be what is passed in', async () => {
      const actual = await resolveRunOptions({
        extensionDir: 'path/to/extension',
        target: 'custom',
        browserBinaries: {
          custom: '/path/to/custom/browser',
        },
      });
      expect(actual).toMatchObject<Partial<ResolvedRunOptions>>({
        target: 'custom',
      });
    });

    it('should throw an error if the target binary could not be found', async () => {
      const actual = resolveRunOptions({
        extensionDir: 'path/to/extension',
        target: 'custom',
      });
      await expect(actual).rejects.toThrow('Could not find "custom" binary.');
    });
  });

  describe('browserBinary', () => {
    it('should denormalize the browserBinary', async () => {
      const path =
        process.platform === 'win32'
          ? 'C:/path/to/custom/browser.exe'
          : '/path/to/custom/browser';
      const expectedPath =
        process.platform === 'win32'
          ? 'C:\\path\\to\\custom\\browser.exe'
          : path;
      const actual = await resolveRunOptions({
        extensionDir: 'path/to/extension',
        target: 'custom',
        browserBinaries: {
          custom: path,
        },
      });
      expect(actual).toMatchObject<Partial<ResolvedRunOptions>>({
        browserBinary: expectedPath,
      });
    });
  });

  describe('chromiumArgs', () => {
    it('should log a warning when --user-data-dir is passed in', async () => {
      const warnSpy = vi.spyOn(console, 'warn');
      await resolveRunOptions({
        chromiumArgs: ['--user-data-dir=some/custom/path'],
      });
      expect(warnSpy).toBeCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Custom Chromium --user-data-dir argument ignored',
        ),
      );
    });

    it('should log a warning when --remote-debugging-port is passed in', async () => {
      const warnSpy = vi.spyOn(console, 'warn');
      await resolveRunOptions({
        chromiumArgs: ['--remote-debugging-port=9222'],
      });
      expect(warnSpy).toBeCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Custom Chromium --remote-debugging-port argument ignored',
        ),
      );
    });

    it('should combine default args with user provided ones', async () => {
      const actual = await resolveRunOptions({
        chromiumArgs: ['--window-size=1920,1080'],
      });
      expect(actual.chromiumArgs).toEqual([
        // Defaults
        '--disable-features=Translate,OptimizationHints,MediaRouter,DialMediaRouteProvider,CalculateNativeWinOcclusion,InterestFeedContentSuggestions,CertificateTransparencyComponentUpdater,AutofillServerCommunication,PrivacySandboxSettings4',
        '--disable-component-extensions-with-background-pages',
        '--disable-background-networking',
        '--disable-component-update',
        '--disable-client-side-phishing-detection',
        '--disable-sync',
        '--metrics-recording-only',
        '--disable-default-apps',
        '--no-default-browser-check',
        '--no-first-run',
        '--disable-background-timer-throttling',
        '--disable-ipc-flooding-protection',
        '--password-store=basic',
        '--use-mock-keychain',
        '--force-fieldtrials=*BackgroundTracing/default/',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-domain-reliability',
        '--propagate-iph-for-testing',
        // Debugging
        expect.stringContaining('--remote-debugging-port='),
        '--remote-debugging-pipe',
        expect.stringContaining('--user-data-dir='), // See dataPersistence tests
        '--enable-unsafe-extension-debugging',
        // User provided
        '--window-size=1920,1080',
      ]);
    });
  });

  describe('firefoxArgs', () => {
    it('should log a warning when --profile is passed in', async () => {
      const warnSpy = vi.spyOn(console, 'warn');
      await resolveRunOptions({
        firefoxArgs: ['--profile=some/custom/path'],
      });
      expect(warnSpy).toBeCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Custom Firefox --profile argument ignored'),
      );
    });

    it('should log a warning when --remote-debugging-port is passed in', async () => {
      const warnSpy = vi.spyOn(console, 'warn');
      await resolveRunOptions({
        firefoxArgs: ['--remote-debugging-port=9222'],
      });
      expect(warnSpy).toBeCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Custom Firefox --remote-debugging-port argument ignored',
        ),
      );
    });

    it('should combine default args with user provided ones', async () => {
      const actual = await resolveRunOptions({
        firefoxArgs: ['--window-size=1920,1080'],
      });
      expect(actual.firefoxArgs).toEqual([
        // Defaults
        '--new-instance',
        '--no-remote',
        '--profile',
        expect.any(String), // See dataPersistence tests
        expect.stringContaining('--remote-debugging-port='),
        'about:debugging#/runtime/this-firefox',
        // User provided
        '--window-size=1920,1080',
      ]);
    });
  });

  describe('chromiumRemoteDebuggingPort', () => {
    it('should default to 0', async () => {
      const actual = await resolveRunOptions({});
      expect(actual).toMatchObject<Partial<ResolvedRunOptions>>({
        chromiumRemoteDebuggingPort: 0,
        chromiumArgs: expect.arrayContaining([`--remote-debugging-port=0`]),
      });
    });

    it('should respect user provided port', async () => {
      const actual = await resolveRunOptions({
        chromiumRemoteDebuggingPort: 9222,
      });
      expect(actual).toMatchObject<Partial<ResolvedRunOptions>>({
        chromiumRemoteDebuggingPort: 9222,
        chromiumArgs: expect.arrayContaining([`--remote-debugging-port=9222`]),
      });
    });
  });

  describe('firefoxRemoteDebuggingPort', () => {
    it('should default to 0', async () => {
      const actual = await resolveRunOptions({});
      expect(actual).toMatchObject<Partial<ResolvedRunOptions>>({
        firefoxRemoteDebuggingPort: 0,
        firefoxArgs: expect.arrayContaining([`--remote-debugging-port=0`]),
      });
    });

    it('should respect user provided port', async () => {
      const actual = await resolveRunOptions({
        firefoxRemoteDebuggingPort: 9222,
      });
      expect(actual).toMatchObject<Partial<ResolvedRunOptions>>({
        firefoxRemoteDebuggingPort: 9222,
        firefoxArgs: expect.arrayContaining([`--remote-debugging-port=9222`]),
      });
    });
  });

  describe('dataPersistence', () => {
    it('should default to "none"', async () => {
      const actual = await resolveRunOptions({});
      expect(actual).toMatchObject<Partial<ResolvedRunOptions>>({
        dataPersistence: 'none',
      });
    });

    it('should use a temporary directory when set to "none"', async () => {
      const actual = await resolveRunOptions({
        dataPersistence: 'none',
      });
      expect(actual).toMatchObject<Partial<ResolvedRunOptions>>({
        dataPersistence: 'none',
        dataDir: expect.stringContaining(join(tmpDir, 'wxt-runner-')),
        chromiumArgs: expect.arrayContaining([
          expect.stringContaining(
            `--user-data-dir=${join(tmpDir, 'wxt-runner-')}`,
          ),
        ]),
        firefoxArgs: expect.arrayContaining([
          expect.stringContaining(join(tmpDir, 'wxt-runner-')),
        ]),
      });
    });

    it('should use a directory in the current working directory when set to "project"', async () => {
      const actual = await resolveRunOptions({
        dataPersistence: 'project',
      });
      expect(actual).toMatchObject<Partial<ResolvedRunOptions>>({
        dataPersistence: 'project',
        dataDir: expect.stringContaining(join(process.cwd(), '.wxt/runner')),
        chromiumArgs: expect.arrayContaining([
          expect.stringContaining(
            `--user-data-dir=${join(process.cwd(), '.wxt/runner')}`,
          ),
        ]),
        firefoxArgs: expect.arrayContaining([
          expect.stringContaining(join(process.cwd(), '.wxt/runner')),
        ]),
      });
    });

    it('should use a directory in the user\'s home directory when set to "user"', async () => {
      const actual = await resolveRunOptions({
        dataPersistence: 'user',
      });
      expect(actual).toMatchObject<Partial<ResolvedRunOptions>>({
        dataPersistence: 'user',
        dataDir: expect.stringContaining(join(homeDir, '.wxt/runner')),
        chromiumArgs: expect.arrayContaining([
          expect.stringContaining(
            `--user-data-dir=${join(homeDir, '.wxt/runner')}`,
          ),
        ]),
        firefoxArgs: expect.arrayContaining([
          expect.stringContaining(join(homeDir, '.wxt/runner')),
        ]),
      });
    });
  });
});
