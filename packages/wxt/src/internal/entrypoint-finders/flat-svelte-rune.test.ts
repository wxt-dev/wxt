import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateManifest } from '../manifest';
import { findEntrypoints } from '../find-entrypoints';
import {
  fakeResolvedConfig,
  setFakeWxt,
} from '../../internal-utils/testing/fake-objects';
import { FlatEntrypointFinder } from './flat';

describe('Svelte rune content script entrypoints', () => {
  let root: string | undefined;

  afterEach(async () => {
    if (root) await rm(root, { recursive: true, force: true });
    root = undefined;
  });

  it('discovers and registers a rune module as a content script', async () => {
    root = await mkdtemp(join(tmpdir(), 'wxt-svelte-rune-'));
    const entrypointsDir = join(root, 'entrypoints');
    const inputPath = join(entrypointsDir, 'test.content.svelte.ts');
    const outDir = join(root, '.output');
    await mkdir(entrypointsDir);
    await writeFile(
      join(root, 'package.json'),
      '{"name":"fixture","version":"1.0.0"}',
    );
    await writeFile(
      inputPath,
      "export const count = $state(0)\nexport default { matches: ['https://example.com/*'] }\n",
    );

    const config = fakeResolvedConfig({
      root,
      entrypointsDir,
      outDir,
      wxtDir: join(root, '.wxt'),
      command: 'build',
      manifestVersion: 3,
      mode: 'production',
      browser: 'chrome',
    });
    setFakeWxt({
      config,
      entrypointFinder: new FlatEntrypointFinder(config),
      builder: {
        importEntrypoints: vi
          .fn()
          .mockResolvedValue([{ matches: ['https://example.com/*'] }]),
      },
    });

    const entrypoints = await findEntrypoints();
    expect(entrypoints).toMatchObject([
      {
        type: 'content-script',
        name: 'test',
        inputPath,
      },
    ]);

    const { manifest } = await generateManifest(entrypoints, {
      publicAssets: [],
      steps: [],
    });
    expect(manifest.content_scripts).toContainEqual(
      expect.objectContaining({
        matches: ['https://example.com/*'],
        js: ['content-scripts/test.js'],
      }),
    );
  });
});
