import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { deduplicateCss } from '../deduplicate-css';
import { BuildOutput, OutputAsset } from '../../../../types';
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setFakeWxt } from '../../testing/fake-objects';

describe('deduplicateCss', () => {
  const testOutDir = resolve(__dirname, '.test-output');

  beforeEach(async () => {
    // Setup test output directory
    await rm(testOutDir, { recursive: true, force: true });
    await mkdir(testOutDir, { recursive: true });
    await mkdir(resolve(testOutDir, 'content-scripts'), { recursive: true });
    await mkdir(resolve(testOutDir, 'assets'), { recursive: true });

    // Mock wxt with test output directory
    setFakeWxt({
      config: {
        outDir: testOutDir,
      },
    });
  });

  afterEach(async () => {
    // Cleanup
    await rm(testOutDir, { recursive: true, force: true });
  });

  it('should remove duplicate CSS files from assets/', async () => {
    // Setup: Create identical CSS files in both locations
    const cssContent = '.example { color: red; }';
    const csPath = resolve(testOutDir, 'content-scripts/content.css');
    const assetPath = resolve(testOutDir, 'assets/content.css');

    await writeFile(csPath, cssContent, 'utf-8');
    await writeFile(assetPath, cssContent, 'utf-8');

    const output: Omit<BuildOutput, 'manifest'> = {
      steps: [
        {
          entrypoints: [] as any,
          chunks: [
            {
              type: 'asset',
              fileName: 'content-scripts/content.css',
            } as OutputAsset,
            {
              type: 'asset',
              fileName: 'assets/content.css',
            } as OutputAsset,
          ],
        },
      ],
      publicAssets: [],
    };

    await deduplicateCss(output);

    // Verify the duplicate in assets/ was removed
    await expect(readFile(csPath, 'utf-8')).resolves.toBe(cssContent);
    await expect(readFile(assetPath, 'utf-8')).rejects.toThrow();

    // Verify it was removed from output chunks
    expect(output.steps[0].chunks).toHaveLength(1);
    expect(output.steps[0].chunks[0].fileName).toBe(
      'content-scripts/content.css',
    );
  });

  it('should not remove non-duplicate CSS files from assets/', async () => {
    // Setup: Create different CSS files with different names
    const csContent = '.content { color: red; }';
    const assetContent = '.other { color: blue; }';
    const csPath = resolve(testOutDir, 'content-scripts/content.css');
    const assetPath = resolve(testOutDir, 'assets/other.css');

    await writeFile(csPath, csContent, 'utf-8');
    await writeFile(assetPath, assetContent, 'utf-8');

    const output: Omit<BuildOutput, 'manifest'> = {
      steps: [
        {
          entrypoints: [] as any,
          chunks: [
            {
              type: 'asset',
              fileName: 'content-scripts/content.css',
            } as OutputAsset,
            {
              type: 'asset',
              fileName: 'assets/other.css',
            } as OutputAsset,
          ],
        },
      ],
      publicAssets: [],
    };

    await deduplicateCss(output);

    // Verify both files still exist (different names, so not duplicates)
    await expect(readFile(csPath, 'utf-8')).resolves.toBe(csContent);
    await expect(readFile(assetPath, 'utf-8')).resolves.toBe(assetContent);

    // Verify both are still in output chunks
    expect(output.steps[0].chunks).toHaveLength(2);
  });

  it('should not remove files with same name but different content', async () => {
    // Setup: Create files with same name but different content
    const csContent = '.content { color: red; }';
    const assetContent = '.content { color: blue; }'; // Different content
    const csPath = resolve(testOutDir, 'content-scripts/content.css');
    const assetPath = resolve(testOutDir, 'assets/content.css');

    await writeFile(csPath, csContent, 'utf-8');
    await writeFile(assetPath, assetContent, 'utf-8');

    const output: Omit<BuildOutput, 'manifest'> = {
      steps: [
        {
          entrypoints: [] as any,
          chunks: [
            {
              type: 'asset',
              fileName: 'content-scripts/content.css',
            } as OutputAsset,
            {
              type: 'asset',
              fileName: 'assets/content.css',
            } as OutputAsset,
          ],
        },
      ],
      publicAssets: [],
    };

    await deduplicateCss(output);

    // Verify both files still exist (different content, so not duplicates)
    await expect(readFile(csPath, 'utf-8')).resolves.toBe(csContent);
    await expect(readFile(assetPath, 'utf-8')).resolves.toBe(assetContent);

    // Verify both are still in output chunks
    expect(output.steps[0].chunks).toHaveLength(2);
  });

  it('should not remove assets with same content but different names', async () => {
    // Setup: Different base names, same content (legitimate separate files)
    const sameContent = '.shared { color: red; }';
    const cs1Path = resolve(testOutDir, 'content-scripts/content1.css');
    const asset2Path = resolve(testOutDir, 'assets/content2.css');

    await writeFile(cs1Path, sameContent, 'utf-8');
    await writeFile(asset2Path, sameContent, 'utf-8');

    const output: Omit<BuildOutput, 'manifest'> = {
      steps: [
        {
          entrypoints: [] as any,
          chunks: [
            {
              type: 'asset',
              fileName: 'content-scripts/content1.css',
            } as OutputAsset,
            {
              type: 'asset',
              fileName: 'assets/content2.css',
            } as OutputAsset,
          ],
        },
      ],
      publicAssets: [],
    };

    await deduplicateCss(output);

    // Verify both files still exist (different names, even though content is same)
    await expect(readFile(cs1Path, 'utf-8')).resolves.toBe(sameContent);
    await expect(readFile(asset2Path, 'utf-8')).resolves.toBe(sameContent);

    // Verify both are still in output chunks
    expect(output.steps[0].chunks).toHaveLength(2);
  });

  it('should handle multiple content script CSS files', async () => {
    // Setup: Create multiple content scripts with CSS
    const css1Content = '.content1 { color: red; }';
    const css2Content = '.content2 { color: blue; }';

    const cs1Path = resolve(testOutDir, 'content-scripts/content1.css');
    const cs2Path = resolve(testOutDir, 'content-scripts/content2.css');
    const asset1Path = resolve(testOutDir, 'assets/content1.css');
    const asset2Path = resolve(testOutDir, 'assets/content2.css');

    await writeFile(cs1Path, css1Content, 'utf-8');
    await writeFile(cs2Path, css2Content, 'utf-8');
    await writeFile(asset1Path, css1Content, 'utf-8'); // Duplicate
    await writeFile(asset2Path, css2Content, 'utf-8'); // Duplicate

    const output: Omit<BuildOutput, 'manifest'> = {
      steps: [
        {
          entrypoints: [] as any,
          chunks: [
            {
              type: 'asset',
              fileName: 'content-scripts/content1.css',
            } as OutputAsset,
            {
              type: 'asset',
              fileName: 'content-scripts/content2.css',
            } as OutputAsset,
            {
              type: 'asset',
              fileName: 'assets/content1.css',
            } as OutputAsset,
            {
              type: 'asset',
              fileName: 'assets/content2.css',
            } as OutputAsset,
          ],
        },
      ],
      publicAssets: [],
    };

    await deduplicateCss(output);

    // Verify duplicates in assets/ were removed
    await expect(readFile(cs1Path, 'utf-8')).resolves.toBe(css1Content);
    await expect(readFile(cs2Path, 'utf-8')).resolves.toBe(css2Content);
    await expect(readFile(asset1Path, 'utf-8')).rejects.toThrow();
    await expect(readFile(asset2Path, 'utf-8')).rejects.toThrow();

    // Verify only content-script CSS remains in output
    expect(output.steps[0].chunks).toHaveLength(2);
    expect(output.steps[0].chunks[0].fileName).toBe(
      'content-scripts/content1.css',
    );
    expect(output.steps[0].chunks[1].fileName).toBe(
      'content-scripts/content2.css',
    );
  });

  it('should do nothing when no content script CSS exists', async () => {
    // Setup: Only assets CSS, no content-scripts CSS
    const assetContent = '.asset { color: blue; }';
    const assetPath = resolve(testOutDir, 'assets/styles.css');

    await writeFile(assetPath, assetContent, 'utf-8');

    const output: Omit<BuildOutput, 'manifest'> = {
      steps: [
        {
          entrypoints: [] as any,
          chunks: [
            {
              type: 'asset',
              fileName: 'assets/styles.css',
            } as OutputAsset,
          ],
        },
      ],
      publicAssets: [],
    };

    await deduplicateCss(output);

    // Verify asset CSS is still there
    await expect(readFile(assetPath, 'utf-8')).resolves.toBe(assetContent);
    expect(output.steps[0].chunks).toHaveLength(1);
  });

  it('should handle missing files gracefully', async () => {
    // Setup: Reference files that don't exist
    const output: Omit<BuildOutput, 'manifest'> = {
      steps: [
        {
          entrypoints: [] as any,
          chunks: [
            {
              type: 'asset',
              fileName: 'content-scripts/nonexistent.css',
            } as OutputAsset,
            {
              type: 'asset',
              fileName: 'assets/also-nonexistent.css',
            } as OutputAsset,
          ],
        },
      ],
      publicAssets: [],
    };

    // Should not throw
    await expect(deduplicateCss(output)).resolves.toBeUndefined();
  });

  it('should handle output with multiple steps', async () => {
    // Setup: Multiple build steps with CSS
    const css1Content = '.step1 { color: red; }';
    const css2Content = '.step2 { color: blue; }';

    const cs1Path = resolve(testOutDir, 'content-scripts/step1.css');
    const cs2Path = resolve(testOutDir, 'content-scripts/step2.css');
    const asset1Path = resolve(testOutDir, 'assets/step1.css');
    const asset2Path = resolve(testOutDir, 'assets/step2.css');

    await writeFile(cs1Path, css1Content, 'utf-8');
    await writeFile(cs2Path, css2Content, 'utf-8');
    await writeFile(asset1Path, css1Content, 'utf-8');
    await writeFile(asset2Path, css2Content, 'utf-8');

    const output: Omit<BuildOutput, 'manifest'> = {
      steps: [
        {
          entrypoints: [] as any,
          chunks: [
            {
              type: 'asset',
              fileName: 'content-scripts/step1.css',
            } as OutputAsset,
            {
              type: 'asset',
              fileName: 'assets/step1.css',
            } as OutputAsset,
          ],
        },
        {
          entrypoints: [] as any,
          chunks: [
            {
              type: 'asset',
              fileName: 'content-scripts/step2.css',
            } as OutputAsset,
            {
              type: 'asset',
              fileName: 'assets/step2.css',
            } as OutputAsset,
          ],
        },
      ],
      publicAssets: [],
    };

    await deduplicateCss(output);

    // Verify duplicates were removed from both steps
    expect(output.steps[0].chunks).toHaveLength(1);
    expect(output.steps[0].chunks[0].fileName).toBe(
      'content-scripts/step1.css',
    );
    expect(output.steps[1].chunks).toHaveLength(1);
    expect(output.steps[1].chunks[0].fileName).toBe(
      'content-scripts/step2.css',
    );
  });
});
