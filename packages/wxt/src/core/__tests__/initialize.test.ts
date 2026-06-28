import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { initialize } from '../initialize';

const mocks = vi.hoisted(() => ({
  downloadTemplate: vi.fn(),
  destinationDir: '',
}));

vi.mock('prompts', () => ({
  default: vi.fn(() => ({})),
}));

vi.mock('giget', () => ({
  downloadTemplate: mocks.downloadTemplate,
}));

vi.mock('nanospinner', () => ({
  createSpinner: () => ({
    start() {
      return this;
    },
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('initialize', () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await mkdtemp(path.join(tmpdir(), 'wxt-init-test-'));
    mocks.destinationDir = path.join(rootDir, 'extension');
    await mkdir(path.join(rootDir, '.git'));
    await mkdir(mocks.destinationDir);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            files: [{ path: 'templates/vue/package.json' }],
          }),
          { status: 200, statusText: 'OK' },
        );
      }),
    );

    mocks.downloadTemplate.mockImplementation(async (_input, options) => {
      await mkdir(options.dir, { recursive: true });
      await writeFile(path.join(options.dir, 'package.json'), '{}');

      if (options.dir !== mocks.destinationDir) {
        await writeFile(path.join(options.dir, '_gitignore'), 'node_modules\n');
      }
    });
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    await rm(rootDir, { recursive: true, force: true });
  });

  it('creates the gitignore when the destination already exists inside a parent Git repo', async () => {
    await initialize({
      directory: mocks.destinationDir,
      template: 'vue',
      packageManager: 'npm',
    });

    const extractedDir = mocks.downloadTemplate.mock.calls[0][1].dir;
    expect(extractedDir).not.toBe(mocks.destinationDir);
    expect(
      await readFile(path.join(mocks.destinationDir, '.gitignore'), 'utf8'),
    ).toBe('node_modules\n');
    await expect(readdir(mocks.destinationDir)).resolves.not.toContain(
      '_gitignore',
    );
  });
});
