import { describe, it, expect, vi } from 'vitest';
import {
  BackgroundEntrypoint,
  ContentScriptEntrypoint,
  GenericEntrypoint,
  InternalConfig,
  OptionsEntrypoint,
  PopupEntrypoint,
} from '../../types';
import { resolve } from 'path';
import { findEntrypoints } from '../findEntrypoints';
import fs from 'fs-extra';
import { importTsFile } from '../../utils/importTsFile';
import glob from 'fast-glob';

vi.mock('../../utils/importTsFile');
const importTsFileMock = vi.mocked(importTsFile);

vi.mock('fast-glob');
const globMock = vi.mocked(glob);

vi.mock('fs-extra');
const readFileMock = vi.mocked(
  fs.readFile as (path: string) => Promise<string>,
);

describe('findEntrypoints', () => {
  const config: InternalConfig = {
    root: '/',
    entrypointsDir: resolve('/src/entrypoints'),
    outDir: resolve('.output'),
    logger: {
      debug: vi.fn(),
      error: vi.fn(),
      fatal: (...args) => {
        throw Error('logger.fatal called with: ' + JSON.stringify(args));
      },
      info: vi.fn(),
      log: vi.fn(),
      warn: vi.fn(),
      success: vi.fn(),
    },
    command: 'build',
    mode: 'production',
  };

  it.each<[string, string, PopupEntrypoint]>([
    [
      'popup.html',
      `
        <html>
          <head>
            <meta name="manifest.default_icon" content="{ '16': '/icon/16.png' }" />
            <title>Default Title</title>
          </head>
        </html>
      `,
      {
        type: 'popup',
        name: 'popup',
        inputPath: resolve(config.entrypointsDir, 'popup.html'),
        outputDir: config.outDir,
        options: {
          defaultIcon: { '16': '/icon/16.png' },
          defaultTitle: 'Default Title',
        },
      },
    ],
    [
      'popup/index.html',
      `
        <html>
          <head>
            <title>Title</title>
          </head>
        </html>
      `,
      {
        type: 'popup',
        name: 'popup',
        inputPath: resolve(config.entrypointsDir, 'popup/index.html'),
        outputDir: config.outDir,
        options: {
          defaultTitle: 'Title',
        },
      },
    ],
  ])(
    'should find and load popup entrypoint config from %s',
    async (path, content, expected) => {
      globMock.mockResolvedValueOnce([path]);
      readFileMock.mockResolvedValueOnce(content);

      const entrypoints = await findEntrypoints(config);

      expect(entrypoints).toHaveLength(1);
      expect(entrypoints[0]).toEqual(expected);
    },
  );

  it.each<[string, string, OptionsEntrypoint]>([
    [
      'options.html',
      `
        <html>
          <head>
            <title>Default Title</title>
          </head>
        </html>
      `,
      {
        type: 'options',
        name: 'options',
        inputPath: resolve(config.entrypointsDir, 'options.html'),
        outputDir: config.outDir,
        options: {},
      },
    ],
    [
      'options/index.html',
      `
        <html>
          <head>
            <meta name="manifest.open_in_tab" content="true" />
            <title>Title</title>
          </head>
        </html>
      `,
      {
        type: 'options',
        name: 'options',
        inputPath: resolve(config.entrypointsDir, 'options/index.html'),
        outputDir: config.outDir,
        options: {
          openInTab: true,
        },
      },
    ],
  ])(
    'should find and load options entrypoint config from %s',
    async (path, content, expected) => {
      globMock.mockResolvedValueOnce([path]);
      readFileMock.mockResolvedValueOnce(content);

      const entrypoints = await findEntrypoints(config);

      expect(entrypoints).toHaveLength(1);
      expect(entrypoints[0]).toEqual(expected);
    },
  );

  it.each<[string, Omit<ContentScriptEntrypoint, 'options'>]>([
    [
      'overlay.content.ts',
      {
        type: 'content-script',
        name: 'overlay',
        inputPath: resolve(config.entrypointsDir, 'overlay.content.ts'),
        outputDir: resolve(config.outDir, 'content-scripts'),
      },
    ],
    [
      'overlay.content/index.ts',
      {
        type: 'content-script',
        name: 'overlay',
        inputPath: resolve(config.entrypointsDir, 'overlay.content/index.ts'),
        outputDir: resolve(config.outDir, 'content-scripts'),
      },
    ],
    [
      'overlay.content.tsx',
      {
        type: 'content-script',
        name: 'overlay',
        inputPath: resolve(config.entrypointsDir, 'overlay.content.tsx'),
        outputDir: resolve(config.outDir, 'content-scripts'),
      },
    ],
  ])(
    'should find and load content script entrypoint config from %s',
    async (path, expected) => {
      const options: ContentScriptEntrypoint['options'] = {
        matches: ['<all_urls>'],
      };
      globMock.mockResolvedValueOnce([path]);
      importTsFileMock.mockResolvedValue(options);

      const entrypoints = await findEntrypoints(config);

      expect(entrypoints).toHaveLength(1);
      expect(entrypoints[0]).toEqual({ ...expected, options });
      expect(importTsFileMock).toBeCalledWith(config.root, expected.inputPath);
    },
  );

  it.each<[string, Omit<BackgroundEntrypoint, 'options'>]>([
    [
      'background.ts',
      {
        type: 'background',
        name: 'background',
        inputPath: resolve(config.entrypointsDir, 'background.ts'),
        outputDir: config.outDir,
      },
    ],
  ])(
    'should find and load content script entrypoint config from %s',
    async (path, expected) => {
      const options: ContentScriptEntrypoint['options'] = {
        matches: ['<all_urls>'],
      };
      globMock.mockResolvedValueOnce([path]);
      importTsFileMock.mockResolvedValue(options);

      const entrypoints = await findEntrypoints(config);

      expect(entrypoints).toHaveLength(1);
      expect(entrypoints[0]).toEqual({ ...expected, options });
      expect(importTsFileMock).toBeCalledWith(config.root, expected.inputPath);
    },
  );

  it.each<[string, GenericEntrypoint]>([
    // Sandbox
    [
      'sandbox.html',
      {
        type: 'sandbox',
        name: 'sandbox',
        inputPath: resolve(config.entrypointsDir, 'sandbox.html'),
        outputDir: config.outDir,
      },
    ],
    [
      'sandbox/index.html',
      {
        type: 'sandbox',
        name: 'sandbox',
        inputPath: resolve(config.entrypointsDir, 'sandbox/index.html'),
        outputDir: config.outDir,
      },
    ],
    [
      'named.sandbox.html',
      {
        type: 'sandbox',
        name: 'named',
        inputPath: resolve(config.entrypointsDir, 'named.sandbox.html'),
        outputDir: config.outDir,
      },
    ],
    [
      'named.sandbox/index.html',
      {
        type: 'sandbox',
        name: 'named',
        inputPath: resolve(config.entrypointsDir, 'named.sandbox/index.html'),
        outputDir: config.outDir,
      },
    ],

    // bookmarks
    [
      'bookmarks.html',
      {
        type: 'bookmarks',
        name: 'bookmarks',
        inputPath: resolve(config.entrypointsDir, 'bookmarks.html'),
        outputDir: config.outDir,
      },
    ],
    [
      'bookmarks/index.html',
      {
        type: 'bookmarks',
        name: 'bookmarks',
        inputPath: resolve(config.entrypointsDir, 'bookmarks/index.html'),
        outputDir: config.outDir,
      },
    ],

    // history
    [
      'history.html',
      {
        type: 'history',
        name: 'history',
        inputPath: resolve(config.entrypointsDir, 'history.html'),
        outputDir: config.outDir,
      },
    ],
    [
      'history/index.html',
      {
        type: 'history',
        name: 'history',
        inputPath: resolve(config.entrypointsDir, 'history/index.html'),
        outputDir: config.outDir,
      },
    ],

    // newtab
    [
      'newtab.html',
      {
        type: 'newtab',
        name: 'newtab',
        inputPath: resolve(config.entrypointsDir, 'newtab.html'),
        outputDir: config.outDir,
      },
    ],
    [
      'newtab/index.html',
      {
        type: 'newtab',
        name: 'newtab',
        inputPath: resolve(config.entrypointsDir, 'newtab/index.html'),
        outputDir: config.outDir,
      },
    ],

    // sidepanel
    [
      'sidepanel.html',
      {
        type: 'sidepanel',
        name: 'sidepanel',
        inputPath: resolve(config.entrypointsDir, 'sidepanel.html'),
        outputDir: config.outDir,
      },
    ],
    [
      'sidepanel/index.html',
      {
        type: 'sidepanel',
        name: 'sidepanel',
        inputPath: resolve(config.entrypointsDir, 'sidepanel/index.html'),
        outputDir: config.outDir,
      },
    ],
    [
      'named.sidepanel.html',
      {
        type: 'sidepanel',
        name: 'named',
        inputPath: resolve(config.entrypointsDir, 'named.sidepanel.html'),
        outputDir: config.outDir,
      },
    ],
    [
      'named.sidepanel/index.html',
      {
        type: 'sidepanel',
        name: 'named',
        inputPath: resolve(config.entrypointsDir, 'named.sidepanel/index.html'),
        outputDir: config.outDir,
      },
    ],

    // devtools
    [
      'devtools.html',
      {
        type: 'devtools',
        name: 'devtools',
        inputPath: resolve(config.entrypointsDir, 'devtools.html'),
        outputDir: config.outDir,
      },
    ],
    [
      'devtools/index.html',
      {
        type: 'devtools',
        name: 'devtools',
        inputPath: resolve(config.entrypointsDir, 'devtools/index.html'),
        outputDir: config.outDir,
      },
    ],

    // unlisted-page
    [
      'onboarding.html',
      {
        type: 'unlisted-page',
        name: 'onboarding',
        inputPath: resolve(config.entrypointsDir, 'onboarding.html'),
        outputDir: config.outDir,
      },
    ],
    [
      'onboarding/index.html',
      {
        type: 'unlisted-page',
        name: 'onboarding',
        inputPath: resolve(config.entrypointsDir, 'onboarding/index.html'),
        outputDir: config.outDir,
      },
    ],

    // unlisted-script
    [
      'injected.ts',
      {
        type: 'unlisted-script',
        name: 'injected',
        inputPath: resolve(config.entrypointsDir, 'injected.ts'),
        outputDir: config.outDir,
      },
    ],
  ])('should find entrypoint for %s', async (path, expected) => {
    globMock.mockResolvedValueOnce([path]);

    const entrypoints = await findEntrypoints(config);

    expect(entrypoints).toHaveLength(1);
    expect(entrypoints[0]).toEqual(expected);
  });

  it('should not allow multiple entrypoints with the same name', async () => {
    globMock.mockResolvedValueOnce(['popup.html', 'popup/index.html']);

    await expect(() => findEntrypoints(config)).rejects.toThrowError(
      'Multiple entrypoints with the name "popup" detected, but only one is allowed: src/entrypoints/popup.html, src/entrypoints/popup/index.html',
    );
  });
});
