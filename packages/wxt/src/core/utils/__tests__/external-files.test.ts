import { describe, it, expect, vi, beforeEach } from 'vitest';
import { gatherExternalFiles } from '../external-files';
import { BuildOutput, OutputChunk } from '../../../types';
import fs from 'fs-extra';
import path from 'node:path';
import { setFakeWxt } from '../testing/fake-objects';

// Mock fs-extra
vi.mock('fs-extra');
const mockFs = vi.mocked(fs);

describe('gatherExternalFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup fake wxt instance with default config
    setFakeWxt({
      config: {
        zip: {
          sourcesRoot: '/project/src',
        },
        logger: {
          info: vi.fn(),
          debug: vi.fn(),
        },
      },
    });
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
    const externalFile = '/parent/shared/utils.ts';

    // Mock fs.access to succeed for external file
    mockFs.access.mockImplementation((filePath) => {
      if (filePath === externalFile) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('File not found'));
    });

    const buildOutput: BuildOutput = {
      manifest: { manifest_version: 3, name: 'test', version: '1.0.0' },
      publicAssets: [],
      steps: [
        {
          chunks: [
            {
              type: 'chunk',
              fileName: 'background.js',
              moduleIds: ['/project/src/background.ts', externalFile],
            } as OutputChunk,
          ],
          entrypoints: [],
        },
      ],
    };

    const result = await gatherExternalFiles(buildOutput);
    expect(result).toEqual([externalFile]);
    expect(mockFs.access).toHaveBeenCalledWith(externalFile);
  });

  it('should exclude files in node_modules', async () => {
    const nodeModuleFile = '/project/node_modules/some-package/index.js';

    const buildOutput: BuildOutput = {
      manifest: { manifest_version: 3, name: 'test', version: '1.0.0' },
      publicAssets: [],
      steps: [
        {
          chunks: [
            {
              type: 'chunk',
              fileName: 'background.js',
              moduleIds: ['/project/src/background.ts', nodeModuleFile],
            } as OutputChunk,
          ],
          entrypoints: [],
        },
      ],
    };

    const result = await gatherExternalFiles(buildOutput);
    expect(result).toEqual([]);
    expect(mockFs.access).not.toHaveBeenCalledWith(nodeModuleFile);
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
              moduleIds: ['/project/src/background.ts', virtualModule],
            } as OutputChunk,
          ],
          entrypoints: [],
        },
      ],
    };

    const result = await gatherExternalFiles(buildOutput);
    expect(result).toEqual([]);
    expect(mockFs.access).not.toHaveBeenCalledWith(virtualModule);
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
              moduleIds: ['/project/src/background.ts', httpUrl],
            } as OutputChunk,
          ],
          entrypoints: [],
        },
      ],
    };

    const result = await gatherExternalFiles(buildOutput);
    expect(result).toEqual([]);
    expect(mockFs.access).not.toHaveBeenCalledWith(httpUrl);
  });

  it('should skip non-existent external files', async () => {
    const nonExistentFile = '/parent/missing/file.ts';

    // Mock fs.access to reject for non-existent file
    mockFs.access.mockRejectedValue(new Error('File not found'));

    const buildOutput: BuildOutput = {
      manifest: { manifest_version: 3, name: 'test', version: '1.0.0' },
      publicAssets: [],
      steps: [
        {
          chunks: [
            {
              type: 'chunk',
              fileName: 'background.js',
              moduleIds: ['/project/src/background.ts', nonExistentFile],
            } as OutputChunk,
          ],
          entrypoints: [],
        },
      ],
    };

    const result = await gatherExternalFiles(buildOutput);
    expect(result).toEqual([]);
    expect(mockFs.access).toHaveBeenCalledWith(nonExistentFile);
  });

  it('should handle multiple external files and deduplicate them', async () => {
    const externalFile1 = '/parent/shared/utils.ts';
    const externalFile2 = '/parent/shared/types.ts';

    // Mock fs.access to succeed for both external files
    mockFs.access.mockImplementation((filePath) => {
      if (filePath === externalFile1 || filePath === externalFile2) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('File not found'));
    });

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
    const externalFile = '/parent/shared/utils.ts';

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

    // Mock fs.access to succeed
    mockFs.access.mockResolvedValue(undefined);

    const result = await gatherExternalFiles(buildOutput);
    expect(result).toEqual([externalFile]);
    expect(mockFs.access).toHaveBeenCalledOnce();
  });
});
