import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chmod,
  mkdir,
  mkdtemp,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createWslChromiumProfile,
  findLinuxChromium,
  hasDisplay,
  isUnusableSnap,
  which,
} from '../wsl-utils';

vi.mock('node:os', async (importOriginal) => {
  const os = await importOriginal<typeof import('node:os')>();
  return { ...os, homedir: vi.fn(), tmpdir: vi.fn() };
});
const homedirMock = vi.mocked(homedir);
const tmpdirMock = vi.mocked(tmpdir);

const ELF = Buffer.concat([Buffer.from('\x7fELF', 'latin1'), Buffer.alloc(64)]);
const FIREFOX_SNAP_SHIM = `#!/bin/sh
if ! [ -x /snap/bin/firefox ]; then
    exit 1
fi
exec /snap/bin/firefox "$@"
`;
const CHROMIUM_SNAP_SHIM = '#!/bin/sh\nexec /snap/bin/chromium "$@"\n';

// WSL is Linux only, and these tests rely on POSIX paths and file modes.
describe.skipIf(process.platform === 'win32')('WSL Utils', () => {
  let dir: string;

  async function createExecutable(name: string, contents: string | Buffer) {
    const file = join(dir, name);
    await mkdir(join(file, '..'), { recursive: true });
    await writeFile(file, contents);
    await chmod(file, 0o755);
    return file;
  }

  beforeEach(async () => {
    const os = await vi.importActual<typeof import('node:os')>('node:os');
    dir = await mkdtemp(join(os.tmpdir(), 'wxt-wsl-utils-test-'));
    homedirMock.mockReturnValue('/home/user');
    tmpdirMock.mockReturnValue('/tmp');
    vi.stubEnv('PATH', join(dir, 'bin'));
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(dir, { recursive: true, force: true });
  });

  describe('hasDisplay', () => {
    it.each([
      [true, ':0', ''],
      [true, '', 'wayland-0'],
      [true, ':0', 'wayland-0'],
      [false, '', ''],
    ])(
      'should return %s when DISPLAY=%j and WAYLAND_DISPLAY=%j',
      (expected, display, waylandDisplay) => {
        vi.stubEnv('DISPLAY', display);
        vi.stubEnv('WAYLAND_DISPLAY', waylandDisplay);

        expect(hasDisplay()).toBe(expected);
      },
    );
  });

  describe('which', () => {
    it('should return the first executable on the PATH', async () => {
      await createExecutable('first/firefox', ELF);
      await createExecutable('second/firefox', ELF);
      vi.stubEnv(
        'PATH',
        ['/does-not-exist', join(dir, 'first'), join(dir, 'second')].join(':'),
      );

      expect(await which('firefox')).toBe(join(dir, 'first/firefox'));
    });

    it('should return undefined when the command is not on the PATH', async () => {
      expect(await which('firefox')).toBeUndefined();
    });
  });

  describe('isUnusableSnap', () => {
    it('should detect a binary inside the Snap tree', async () => {
      const binary = await createExecutable('snap/firefox/current/firefox', '');

      expect(await isUnusableSnap(binary)).toBe(true);
    });

    it('should detect a symlink into the Snap tree', async () => {
      const target = await createExecutable('snap/bin/firefox', '');
      const binary = join(dir, 'firefox');
      await symlink(target, binary);

      expect(await isUnusableSnap(binary)).toBe(true);
    });

    it('should detect a Snap launcher that links to the snap binary', async () => {
      const target = await createExecutable('usr/bin/snap', ELF);
      const binary = join(dir, 'snap/bin/firefox');
      await mkdir(join(dir, 'snap/bin'), { recursive: true });
      await symlink(target, binary);

      expect(await isUnusableSnap(binary)).toBe(true);
    });

    it('should look up a command name on the PATH', async () => {
      await createExecutable('bin/firefox', FIREFOX_SNAP_SHIM);

      expect(await isUnusableSnap('firefox')).toBe(true);
    });

    it("should return false when a command name isn't on the PATH", async () => {
      expect(await isUnusableSnap('firefox')).toBe(false);
    });

    it.each([
      ['Firefox', FIREFOX_SNAP_SHIM],
      ['Chromium', CHROMIUM_SNAP_SHIM],
    ])("should detect Ubuntu's Snap %s shim script", async (_, shim) => {
      const binary = await createExecutable('browser', shim);

      expect(await isUnusableSnap(binary)).toBe(true);
    });

    it('should not flag an ELF binary', async () => {
      const binary = await createExecutable('firefox', ELF);

      expect(await isUnusableSnap(binary)).toBe(false);
    });

    it('should not flag a Snap when the temp directory is inside the home directory', async () => {
      tmpdirMock.mockReturnValue('/home/user/.cache/tmp');
      const binary = await createExecutable('snap/firefox/current/firefox', '');

      expect(await isUnusableSnap(binary)).toBe(false);
    });

    it('should flag a Snap when the temp directory only shares a prefix with the home directory', async () => {
      tmpdirMock.mockReturnValue('/home/user-tmp');
      const binary = await createExecutable('snap/firefox/current/firefox', '');

      expect(await isUnusableSnap(binary)).toBe(true);
    });

    it("should return false when the binary doesn't exist", async () => {
      expect(await isUnusableSnap(join(dir, 'missing'))).toBe(false);
    });
  });

  describe('findLinuxChromium', () => {
    it('should use the configured Linux binary', async () => {
      expect(await findLinuxChromium('/usr/bin/google-chrome')).toBe(
        '/usr/bin/google-chrome',
      );
    });

    it.each([
      '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
      '/mnt/d/chrome/chrome',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    ])('should reject the configured Windows binary %s', async (binary) => {
      expect(await findLinuxChromium(binary)).toBeUndefined();
    });

    it('should find Chrome on the PATH in the same order as chrome-launcher', async () => {
      await createExecutable('bin/chromium', ELF);
      const chrome = await createExecutable('bin/google-chrome', ELF);

      expect(await findLinuxChromium(undefined)).toBe(chrome);
    });

    it('should prefer a non-Snap Chromium on the PATH', async () => {
      await createExecutable('bin/chromium-browser', CHROMIUM_SNAP_SHIM);
      const chromium = await createExecutable('bin/chromium', ELF);

      expect(await findLinuxChromium(undefined)).toBe(chromium);
    });

    it('should fall back to a Snap Chromium on the PATH', async () => {
      const snap = await createExecutable(
        'bin/chromium-browser',
        CHROMIUM_SNAP_SHIM,
      );

      expect(await findLinuxChromium(undefined)).toBe(snap);
    });

    it('should return undefined when no Chromium is on the PATH', async () => {
      expect(await findLinuxChromium(undefined)).toBeUndefined();
    });
  });

  describe('createWslChromiumProfile', () => {
    beforeEach(() => {
      tmpdirMock.mockReturnValue(dir);
    });

    describe('when no chromiumProfile is given', () => {
      it('should create a temporary profile and pass it as --user-data-dir', async () => {
        const profile = await createWslChromiumProfile(undefined);

        expect(profile.chromiumProfile).toContain(
          join(dir, 'wxt-chromium-profile-'),
        );
        expect(profile.args).toEqual([
          `--user-data-dir=${profile.chromiumProfile}`,
        ]);
        expect(await stat(profile.chromiumProfile)).toBeTruthy();

        await profile.cleanup();
        await expect(stat(profile.chromiumProfile)).rejects.toThrow();
      });

      it('should remove the temporary profile on exit', async () => {
        const before = process.listeners('exit');
        const profile = await createWslChromiumProfile(undefined);
        const [removeOnExit] = process
          .listeners('exit')
          .filter((listener) => !before.includes(listener));

        removeOnExit(0);

        await expect(stat(profile.chromiumProfile)).rejects.toThrow();
        await profile.cleanup();
        expect(process.listeners('exit')).toEqual(before);
      });
    });

    describe('when a chromiumProfile is given', () => {
      it('should reuse a user data directory', async () => {
        const userDataDir = join(dir, 'chrome');
        await mkdir(join(userDataDir, 'Default'), { recursive: true });
        await writeFile(join(userDataDir, 'Local State'), '{}');

        const profile = await createWslChromiumProfile(userDataDir);
        await profile.cleanup();

        expect(profile).toMatchObject({
          chromiumProfile: userDataDir,
          args: [`--user-data-dir=${userDataDir}`],
        });
        expect(await stat(userDataDir)).toBeTruthy();
      });

      it("should use a profile directory's parent as the user data directory", async () => {
        const userDataDir = join(dir, 'chrome');
        const profileDir = join(userDataDir, 'Profile 1');
        await mkdir(profileDir, { recursive: true });
        await writeFile(join(profileDir, 'Secure Preferences'), '{}');

        const profile = await createWslChromiumProfile(profileDir);

        expect(profile).toMatchObject({
          chromiumProfile: profileDir,
          args: [`--user-data-dir=${userDataDir}`],
        });
      });
    });
  });
});
