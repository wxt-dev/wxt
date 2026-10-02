import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  chmod,
  mkdir,
  mkdtemp,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { isUnusableSnapFirefox } from '../wsl';

vi.mock('node:os', async (importOriginal) => {
  const os = await importOriginal<typeof import('node:os')>();
  return { ...os, homedir: vi.fn(), tmpdir: vi.fn() };
});
const homedirMock = vi.mocked(homedir);
const tmpdirMock = vi.mocked(tmpdir);

const SNAP_SHIM = `#!/bin/sh
if ! [ -x /snap/bin/firefox ]; then
    exit 1
fi
exec /snap/bin/firefox "$@"
`;

describe('isUnusableSnapFirefox', () => {
  let dir: string;
  let originalPath: string | undefined;

  async function createExecutable(name: string, contents: string | Buffer) {
    const file = join(dir, name);
    await mkdir(join(file, '..'), { recursive: true });
    await writeFile(file, contents);
    await chmod(file, 0o755);
    return file;
  }

  beforeEach(async () => {
    const os = await vi.importActual<typeof import('node:os')>('node:os');
    dir = await mkdtemp(join(os.tmpdir(), 'wxt-wsl-test-'));
    homedirMock.mockReturnValue('/home/user');
    tmpdirMock.mockReturnValue('/tmp');
    originalPath = process.env.PATH;
  });

  afterEach(async () => {
    process.env.PATH = originalPath;
    await rm(dir, { recursive: true, force: true });
  });

  it('should detect the Snap binary', async () => {
    const binary = await createExecutable('snap/firefox/current/firefox', '');

    await expect(isUnusableSnapFirefox(binary)).resolves.toBe(true);
  });

  it('should detect a symlink into the Snap tree', async () => {
    const target = await createExecutable('snap/bin/firefox', '');
    const binary = join(dir, 'firefox');
    await symlink(target, binary);

    await expect(isUnusableSnapFirefox(binary)).resolves.toBe(true);
  });

  it("should detect Ubuntu's Snap shim script", async () => {
    const binary = await createExecutable('firefox', SNAP_SHIM);

    await expect(isUnusableSnapFirefox(binary)).resolves.toBe(true);
  });

  it('should find firefox on the PATH when no binary is configured', async () => {
    await createExecutable('bin/firefox', SNAP_SHIM);
    process.env.PATH = ['/does-not-exist', join(dir, 'bin')].join(':');

    await expect(isUnusableSnapFirefox(undefined)).resolves.toBe(true);
  });

  it('should not flag a non-Snap ELF binary', async () => {
    const binary = await createExecutable(
      'firefox',
      Buffer.concat([Buffer.from('\x7fELF', 'latin1'), Buffer.alloc(64)]),
    );

    await expect(isUnusableSnapFirefox(binary)).resolves.toBe(false);
  });

  it('should not flag a Snap Firefox when the temp directory is inside home', async () => {
    tmpdirMock.mockReturnValue('/home/user/.cache/tmp');
    const binary = await createExecutable('snap/firefox/current/firefox', '');

    await expect(isUnusableSnapFirefox(binary)).resolves.toBe(false);
  });

  it('should return false when firefox is not installed', async () => {
    process.env.PATH = join(dir, 'empty');

    await expect(isUnusableSnapFirefox(undefined)).resolves.toBe(false);
    await expect(isUnusableSnapFirefox(join(dir, 'missing'))).resolves.toBe(
      false,
    );
  });
});
