import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BackgroundEntrypoint,
  ContentScriptEntrypoint,
  GenericEntrypoint,
  OptionsEntrypoint,
  PopupEntrypoint,
} from '../../types';
import { resolve } from 'path';
import { FindEntrypointsConfig, findEntrypoints } from '../findEntrypoints';
import fs from 'fs-extra';
import { importTsFile } from '../importTsFile';
import glob from 'fast-glob';

vi.mock('../importTsFile');
const importTsFileMock = vi.mocked(importTsFile);

vi.mock('fast-glob');
const globMock = vi.mocked(glob);

vi.mock('fs-extra');
const readFileMock = vi.mocked(
  fs.readFile as (path: string) => Promise<string>,
);

describe('findEntrypoints', () => {
  const config: FindEntrypointsConfig = {
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
    },
    command: 'build',
    mode: 'production',
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.restoreAllMocks();
  });

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
        inputPath: resolve(config.entrypointsDir, 'popup.html'),
        outputDir: resolve(config.outDir, 'popup'),
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
        inputPath: resolve(config.entrypointsDir, 'popup/index.html'),
        outputDir: resolve(config.outDir, 'popup'),
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
        inputPath: resolve(config.entrypointsDir, 'options.html'),
        outputDir: resolve(config.outDir, 'options'),
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
        inputPath: resolve(config.entrypointsDir, 'options/index.html'),
        outputDir: resolve(config.outDir, 'options'),
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
        inputPath: resolve(config.entrypointsDir, 'overlay.content.ts'),
        outputDir: resolve(config.outDir, 'content-scripts/overlay'),
      },
    ],
    [
      'overlay.content/index.ts',
      {
        type: 'content-script',
        inputPath: resolve(config.entrypointsDir, 'overlay.content/index.ts'),
        outputDir: resolve(config.outDir, 'content-scripts/overlay'),
      },
    ],
  ])(
    'should find and load content script entrypoint config from %s',
    async (path, expected) => {
      const options: ContentScriptEntrypoint['options'] = {
        matches: ['<all_urls>'],
      };
      globMock.mockResolvedValueOnce([path]);
      importTsFileMock.mockResolvedValue({
        defaultExport: options,
        dependencies: [],
      });

      const entrypoints = await findEntrypoints(config);

      expect(entrypoints).toHaveLength(1);
      expect(entrypoints[0]).toEqual({ ...expected, options });
      expect(importTsFileMock).toBeCalledWith(
        { mode: config.mode, command: config.command },
        expected.inputPath,
      );
    },
  );

  it.each<[string, Omit<BackgroundEntrypoint, 'options'>]>([
    [
      'background.ts',
      {
        type: 'background',
        inputPath: resolve(config.entrypointsDir, 'background.ts'),
        outputDir: resolve(config.outDir, 'background'),
      },
    ],
  ])(
    'should find and load content script entrypoint config from %s',
    async (path, expected) => {
      const options: ContentScriptEntrypoint['options'] = {
        matches: ['<all_urls>'],
      };
      globMock.mockResolvedValueOnce([path]);
      importTsFileMock.mockResolvedValue({
        defaultExport: options,
        dependencies: [],
      });

      const entrypoints = await findEntrypoints(config);

      expect(entrypoints).toHaveLength(1);
      expect(entrypoints[0]).toEqual({ ...expected, options });
      expect(importTsFileMock).toBeCalledWith(
        { mode: config.mode, command: config.command },
        expected.inputPath,
      );
    },
  );

  it.each<[string, GenericEntrypoint]>([
    // Sandbox
    [
      'sandbox.html',
      {
        type: 'sandbox',
        inputPath: resolve(config.entrypointsDir, 'sandbox.html'),
        outputDir: resolve(config.outDir, 'sandbox'),
      },
    ],
    [
      'sandbox/index.html',
      {
        type: 'sandbox',
        inputPath: resolve(config.entrypointsDir, 'sandbox/index.html'),
        outputDir: resolve(config.outDir, 'sandbox'),
      },
    ],
    [
      'named.sandbox.html',
      {
        type: 'sandbox',
        inputPath: resolve(config.entrypointsDir, 'named.sandbox.html'),
        outputDir: resolve(config.outDir, 'named.sandbox'),
      },
    ],
    [
      'named.sandbox/index.html',
      {
        type: 'sandbox',
        inputPath: resolve(config.entrypointsDir, 'named.sandbox/index.html'),
        outputDir: resolve(config.outDir, 'named.sandbox'),
      },
    ],

    // bookmarks
    [
      'bookmarks.html',
      {
        type: 'bookmarks',
        inputPath: resolve(config.entrypointsDir, 'bookmarks.html'),
        outputDir: resolve(config.outDir, 'bookmarks'),
      },
    ],
    [
      'bookmarks/index.html',
      {
        type: 'bookmarks',
        inputPath: resolve(config.entrypointsDir, 'bookmarks/index.html'),
        outputDir: resolve(config.outDir, 'bookmarks'),
      },
    ],

    // history
    [
      'history.html',
      {
        type: 'history',
        inputPath: resolve(config.entrypointsDir, 'history.html'),
        outputDir: resolve(config.outDir, 'history'),
      },
    ],
    [
      'history/index.html',
      {
        type: 'history',
        inputPath: resolve(config.entrypointsDir, 'history/index.html'),
        outputDir: resolve(config.outDir, 'history'),
      },
    ],

    // newtab
    [
      'newtab.html',
      {
        type: 'newtab',
        inputPath: resolve(config.entrypointsDir, 'newtab.html'),
        outputDir: resolve(config.outDir, 'newtab'),
      },
    ],
    [
      'newtab/index.html',
      {
        type: 'newtab',
        inputPath: resolve(config.entrypointsDir, 'newtab/index.html'),
        outputDir: resolve(config.outDir, 'newtab'),
      },
    ],

    // sidepanel
    [
      'sidepanel.html',
      {
        type: 'sidepanel',
        inputPath: resolve(config.entrypointsDir, 'sidepanel.html'),
        outputDir: resolve(config.outDir, 'sidepanel'),
      },
    ],
    [
      'sidepanel/index.html',
      {
        type: 'sidepanel',
        inputPath: resolve(config.entrypointsDir, 'sidepanel/index.html'),
        outputDir: resolve(config.outDir, 'sidepanel'),
      },
    ],
    [
      'named.sidepanel.html',
      {
        type: 'sidepanel',
        inputPath: resolve(config.entrypointsDir, 'named.sidepanel.html'),
        outputDir: resolve(config.outDir, 'named.sidepanel'),
      },
    ],
    [
      'named.sidepanel/index.html',
      {
        type: 'sidepanel',
        inputPath: resolve(config.entrypointsDir, 'named.sidepanel/index.html'),
        outputDir: resolve(config.outDir, 'named.sidepanel'),
      },
    ],

    // devtools
    [
      'devtools.html',
      {
        type: 'devtools',
        inputPath: resolve(config.entrypointsDir, 'devtools.html'),
        outputDir: resolve(config.outDir, 'devtools'),
      },
    ],
    [
      'devtools/index.html',
      {
        type: 'devtools',
        inputPath: resolve(config.entrypointsDir, 'devtools/index.html'),
        outputDir: resolve(config.outDir, 'devtools'),
      },
    ],

    // unlisted-page
    [
      'onboarding.html',
      {
        type: 'unlisted-page',
        inputPath: resolve(config.entrypointsDir, 'onboarding.html'),
        outputDir: resolve(config.outDir, 'onboarding'),
      },
    ],
    [
      'onboarding/index.html',
      {
        type: 'unlisted-page',
        inputPath: resolve(config.entrypointsDir, 'onboarding/index.html'),
        outputDir: resolve(config.outDir, 'onboarding'),
      },
    ],

    // unlisted-script
    [
      'injected.ts',
      {
        type: 'unlisted-script',
        inputPath: resolve(config.entrypointsDir, 'injected.ts'),
        outputDir: resolve(config.outDir, 'injected'),
      },
    ],
  ])('should find entrypoint for %s', async (path, expected) => {
    globMock.mockResolvedValueOnce([path]);

    const entrypoints = await findEntrypoints(config);

    expect(entrypoints).toHaveLength(1);
    expect(entrypoints[0]).toEqual(expected);
  });

  it.todo(
    'should ignore CSS and JS files inside a HTML page directory',
    () => {},
  );

  it.todo(
    'should warn when there is an unexpected file in the entrypoints directory',
    () => {},
  );

  it.todo(
    'should ignore entrypoints starting with a . (preventing warnings like .DS_Store files)',
    () => {},
  );
});
