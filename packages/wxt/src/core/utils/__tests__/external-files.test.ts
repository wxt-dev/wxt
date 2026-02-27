import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { gatherExternalFiles } from '../external-files';
import { BuildOutput, OutputChunk } from '../../../types';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { setFakeWxt } from '../testing/fake-objects';

describe('gatherExternalFiles', () => {
  let tempDir: string;
  let projectDir: string;
  let externalDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'wxt-external-files-test-'),
    );
    projectDir = path.join(tempDir, 'project');
    externalDir = path.join(tempDir, 'external');

    await fs.ensureDir(path.join(projectDir, 'src'));
    await fs.ensureDir(externalDir);
    vi.clearAllMocks();

    setFakeWxt({
      config: {
        zip: {
          sourcesRoot: path.join(projectDir, 'src'),
        },
        logger: {
          info: vi.fn(),
          debug: vi.fn(),
        },
      },
    });
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should return empty array when no external files are found', async () => {
    const buildOutput: BuildOutput = {
      manifest: { manifest_version: 3, name: 'test', version: '1.0.0' },
      publicAssets: [],
      steps: [
        {
          chunks: [
            {
              type: 'chunk',
              fileName: 'background.js',
              moduleIds: [
                '/project/src/background.ts',
                '/project/src/utils.ts',
              ],
            } as OutputChunk,
          ],
          entrypoints: [],
        },
      ],
    };

    const result = await gatherExternalFiles(buildOutput);
    expect(result).toEqual([]);
  });

  it('should include external files that exist outside the project directory', async () => {
    const externalFile = path.join(externalDir, 'shared-utils.ts');
    await fs.writeFile(externalFile, 'export const shared = true;');

    const buildOutput: BuildOutput = {
      manifest: { manifest_version: 3, name: 'test', version: '1.0.0' },
      publicAssets: [],
      steps: [
        {
          chunks: [
            {
              type: 'chunk',
              fileName: 'background.js',
              moduleIds: [
                path.join(projectDir, 'src', 'background.ts'),
                externalFile,
              ],
            } as OutputChunk,
          ],
          entrypoints: [],
        },
      ],
    };

    const result = await gatherExternalFiles(buildOutput);
    expect(result).toEqual([externalFile]);
  });

  it('should exclude files in node_modules', async () => {
    const nodeModuleFile = path.join(
      projectDir,
      'node_modules',
      'some-package',
      'index.js',
    );

    const buildOutput: BuildOutput = {
      manifest: { manifest_version: 3, name: 'test', version: '1.0.0' },
      publicAssets: [],
      steps: [
        {
          chunks: [
            {
              type: 'chunk',
              fileName: 'background.js',
              moduleIds: [
                path.join(projectDir, 'src', 'background.ts'),
                nodeModuleFile,
              ],
            } as OutputChunk,
          ],
          entrypoints: [],
        },
      ],
    };

    const result = await gatherExternalFiles(buildOutput);
    expect(result).toEqual([]);
  });

  it('should exclude virtual modules', async () => {
    const virtualModule = 'virtual:wxt-background';

    const buildOutput: BuildOutput = {
      manifest: { manifest_version: 3, name: 'test', version: '1.0.0' },
      publicAssets: [],
      steps: [
        {
          chunks: [
            {
              type: 'chunk',
              fileName: 'background.js',
              moduleIds: [
                path.join(projectDir, 'src', 'background.ts'),
                virtualModule,
              ],
            } as OutputChunk,
          ],
          entrypoints: [],
        },
      ],
    };

    const result = await gatherExternalFiles(buildOutput);
    expect(result).toEqual([]);
  });

  it('should exclude HTTP URLs', async () => {
    const httpUrl = 'http://example.com/script.js';

    const buildOutput: BuildOutput = {
      manifest: { manifest_version: 3, name: 'test', version: '1.0.0' },
      publicAssets: [],
      steps: [
        {
          chunks: [
            {
              type: 'chunk',
              fileName: 'background.js',
              moduleIds: [
                path.join(projectDir, 'src', 'background.ts'),
                httpUrl,
              ],
            } as OutputChunk,
          ],
          entrypoints: [],
        },
      ],
    };

    const result = await gatherExternalFiles(buildOutput);
    expect(result).toEqual([]);
  });

  it('should skip non-existent external files', async () => {
    // Use a path in external dir that we don't create (so it won't exist)
    const nonExistentFile = path.join(externalDir, 'missing-file.ts');

    const buildOutput: BuildOutput = {
      manifest: { manifest_version: 3, name: 'test', version: '1.0.0' },
      publicAssets: [],
      steps: [
        {
          chunks: [
            {
              type: 'chunk',
              fileName: 'background.js',
              moduleIds: [
                path.join(projectDir, 'src', 'background.ts'),
                nonExistentFile,
              ],
            } as OutputChunk,
          ],
          entrypoints: [],
        },
      ],
    };

    const result = await gatherExternalFiles(buildOutput);
    expect(result).toEqual([]);
  });

  it('should handle multiple external files and deduplicate them', async () => {
    const externalFile1 = path.join(externalDir, 'utils.ts');
    const externalFile2 = path.join(externalDir, 'types.ts');
    await fs.writeFile(externalFile1, 'export const util = true;');
    await fs.writeFile(externalFile2, 'export type MyType = string;');

    const buildOutput: BuildOutput = {
      manifest: { manifest_version: 3, name: 'test', version: '1.0.0' },
      publicAssets: [],
      steps: [
        {
          chunks: [
            {
              type: 'chunk',
              fileName: 'background.js',
              moduleIds: [
                path.join(projectDir, 'src', 'background.ts'),
                externalFile1,
                externalFile2,
                externalFile1, // Duplicate should be ignored
              ],
            } as OutputChunk,
          ],
          entrypoints: [],
        },
      ],
    };

    const result = await gatherExternalFiles(buildOutput);
    expect(result).toHaveLength(2);
    expect(result).toContain(externalFile1);
    expect(result).toContain(externalFile2);
  });

  it('should only process chunk-type outputs', async () => {
    const externalFile = path.join(externalDir, 'shared-utils.ts');
    await fs.writeFile(externalFile, 'export const shared = true;');

    const buildOutput: BuildOutput = {
      manifest: { manifest_version: 3, name: 'test', version: '1.0.0' },
      publicAssets: [],
      steps: [
        {
          chunks: [
            {
              type: 'asset',
              fileName: 'icon.png',
            },
            {
              type: 'chunk',
              fileName: 'background.js',
              moduleIds: [externalFile],
            } as OutputChunk,
          ],
          entrypoints: [],
        },
      ],
    };

    const result = await gatherExternalFiles(buildOutput);
    expect(result).toEqual([externalFile]);
  });
});
