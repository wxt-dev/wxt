import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { version } from '../version';

vi.mock('giget', () => ({
  downloadTemplate: vi.fn(),
}));

import { downloadTemplate } from 'giget';

import { DOCS_DOWNLOAD_IGNORE, downloadDocs } from '../download-docs';

const downloadTemplateMock = vi.mocked(downloadTemplate);

const expectedDownloadOptions = (outDir: string) => ({
  dir: outDir,
  force: true,
  ignore: DOCS_DOWNLOAD_IGNORE,
});

describe('downloadDocs', () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'wxt-download-docs-'));
    downloadTemplateMock.mockReset();
    downloadTemplateMock.mockImplementation(async (_template, opts) => {
      const dir = opts!.dir!;
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, 'index.md'), '# Docs\n');
      return { dir, source: 'mock' };
    });
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('should download docs to .wxt/docs/v<version> by default', async () => {
    await downloadDocs({ root });

    const outDir = path.join(root, '.wxt', 'docs', `v${version}`);
    expect(downloadTemplateMock).toHaveBeenCalledWith(
      `gh:wxt-dev/wxt/docs#wxt-v${version}`,
      expectedDownloadOptions(outDir),
    );
    expect(await readFile(path.join(outDir, 'index.md'), 'utf-8')).toBe(
      '# Docs\n',
    );
  });

  it('should download docs under a custom outDir relative to root', async () => {
    await downloadDocs({ root, outDir: 'tmp/wxt-docs' });

    const outDir = path.join(root, 'tmp', 'wxt-docs', `v${version}`);
    expect(downloadTemplateMock).toHaveBeenCalledWith(
      `gh:wxt-dev/wxt/docs#wxt-v${version}`,
      expectedDownloadOptions(outDir),
    );
  });

  it('should skip download when the version directory already exists', async () => {
    const outDir = path.join(root, '.wxt', 'docs', `v${version}`);
    await mkdir(outDir, { recursive: true });

    await downloadDocs({ root });

    expect(downloadTemplateMock).not.toHaveBeenCalled();
  });

  it('should redownload when force is true even if the version directory exists', async () => {
    const outDir = path.join(root, '.wxt', 'docs', `v${version}`);
    await mkdir(outDir, { recursive: true });

    await downloadDocs({ root, force: true });

    expect(downloadTemplateMock).toHaveBeenCalledOnce();
    expect(downloadTemplateMock).toHaveBeenCalledWith(
      `gh:wxt-dev/wxt/docs#wxt-v${version}`,
      expectedDownloadOptions(outDir),
    );
  });

  it('should download the current version even if another version directory exists', async () => {
    await mkdir(path.join(root, '.wxt', 'docs', 'v0.0.0'), { recursive: true });

    await downloadDocs({ root });

    expect(downloadTemplateMock).toHaveBeenCalledOnce();
    expect(downloadTemplateMock).toHaveBeenCalledWith(
      `gh:wxt-dev/wxt/docs#wxt-v${version}`,
      expectedDownloadOptions(path.join(root, '.wxt', 'docs', `v${version}`)),
    );
  });

  it('should throw a clear error when download fails', async () => {
    downloadTemplateMock.mockRejectedValue(new Error('network down'));

    await expect(downloadDocs({ root })).rejects.toThrow(
      `Failed to download docs for wxt-v${version}`,
    );
  });
});
