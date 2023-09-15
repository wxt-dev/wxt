import { describe, it, expect, vi } from 'vitest';
import {
  BackgroundEntrypoint,
  ContentScriptEntrypoint,
  GenericEntrypoint,
  OptionsEntrypoint,
  PopupEntrypoint,
} from '../../types';
import { resolve } from 'path';
import { findEntrypoints } from '../findEntrypoints';
import fs from 'fs-extra';
import { importTsFile } from '../../utils/importTsFile';
import glob from 'fast-glob';
import { fakeInternalConfig } from '../../../testing/fake-objects';
import { unnormalizePath } from '../../utils/paths';

vi.mock('../../utils/importTsFile');
const importTsFileMock = vi.mocked(importTsFile);

vi.mock('fast-glob');
const globMock = vi.mocked(glob);

vi.mock('fs-extra');
const readFileMock = vi.mocked(
  fs.readFile as (path: string) => Promise<string>,
);

describe('findEntrypoints', () => {
  const config = fakeInternalConfig({
    root: '/',
    entrypointsDir: resolve('/src/entrypoints'),
    outDir: resolve('.output'),
    command: 'build',
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
      'content.ts',
      {
        type: 'content-script',
        name: 'content',
        inputPath: resolve(config.entrypointsDir, 'content.ts'),
        outputDir: resolve(config.outDir, 'content-scripts'),
      },
    ],
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
      'content/index.ts',
      {
        type: 'content-script',
        name: 'content',
        inputPath: resolve(config.entrypointsDir, 'content/index.ts'),
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
      expect(importTsFileMock).toBeCalledWith(expected.inputPath, config);
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
    'should find and load background entrypoint config from %s',
    async (path, expected) => {
      const options: BackgroundEntrypoint['options'] = {
        type: 'module',
      };
      globMock.mockResolvedValueOnce([path]);
      importTsFileMock.mockResolvedValue(options);

      const entrypoints = await findEntrypoints(config);

      expect(entrypoints).toHaveLength(1);
      expect(entrypoints[0]).toEqual({ ...expected, options });
      expect(importTsFileMock).toBeCalledWith(expected.inputPath, config);
    },
  );

  it("should include a virtual background script so dev reloading works when there isn't a background entrypoint defined by the user", async () => {
    globMock.mockResolvedValueOnce([]);

    const entrypoints = await findEntrypoints({
      ...config,
      command: 'serve',
    });

    expect(entrypoints).toHaveLength(1);
    expect(entrypoints[0]).toEqual({
      type: 'background',
      inputPath: 'virtual:user-background',
      name: 'background',
      options: {},
      outputDir: config.outDir,
    });
  });

  it.each<[string, GenericEntrypoint]>([
    // Sandbox
    [
      'sandbox.html',
      {
        type: 'sandbox',
        name: 'sandbox',
        inputPath: resolve(config.entrypointsDir, 'sandbox.html'),
        outputDir: config.outDir,
        options: {},
      },
    ],
    [
      'sandbox/index.html',
      {
        type: 'sandbox',
        name: 'sandbox',
        inputPath: resolve(config.entrypointsDir, 'sandbox/index.html'),
        outputDir: config.outDir,
        options: {},
      },
    ],
    [
      'named.sandbox.html',
      {
        type: 'sandbox',
        name: 'named',
        inputPath: resolve(config.entrypointsDir, 'named.sandbox.html'),
        outputDir: config.outDir,
        options: {},
      },
    ],
    [
      'named.sandbox/index.html',
      {
        type: 'sandbox',
        name: 'named',
        inputPath: resolve(config.entrypointsDir, 'named.sandbox/index.html'),
        outputDir: config.outDir,
        options: {},
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
        options: {},
      },
    ],
    [
      'bookmarks/index.html',
      {
        type: 'bookmarks',
        name: 'bookmarks',
        inputPath: resolve(config.entrypointsDir, 'bookmarks/index.html'),
        outputDir: config.outDir,
        options: {},
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
        options: {},
      },
    ],
    [
      'history/index.html',
      {
        type: 'history',
        name: 'history',
        inputPath: resolve(config.entrypointsDir, 'history/index.html'),
        outputDir: config.outDir,
        options: {},
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
        options: {},
      },
    ],
    [
      'newtab/index.html',
      {
        type: 'newtab',
        name: 'newtab',
        inputPath: resolve(config.entrypointsDir, 'newtab/index.html'),
        outputDir: config.outDir,
        options: {},
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
        options: {},
      },
    ],
    [
      'sidepanel/index.html',
      {
        type: 'sidepanel',
        name: 'sidepanel',
        inputPath: resolve(config.entrypointsDir, 'sidepanel/index.html'),
        outputDir: config.outDir,
        options: {},
      },
    ],
    [
      'named.sidepanel.html',
      {
        type: 'sidepanel',
        name: 'named',
        inputPath: resolve(config.entrypointsDir, 'named.sidepanel.html'),
        outputDir: config.outDir,
        options: {},
      },
    ],
    [
      'named.sidepanel/index.html',
      {
        type: 'sidepanel',
        name: 'named',
        inputPath: resolve(config.entrypointsDir, 'named.sidepanel/index.html'),
        outputDir: config.outDir,
        options: {},
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
        options: {},
      },
    ],
    [
      'devtools/index.html',
      {
        type: 'devtools',
        name: 'devtools',
        inputPath: resolve(config.entrypointsDir, 'devtools/index.html'),
        outputDir: config.outDir,
        options: {},
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
        options: {},
      },
    ],
    [
      'onboarding/index.html',
      {
        type: 'unlisted-page',
        name: 'onboarding',
        inputPath: resolve(config.entrypointsDir, 'onboarding/index.html'),
        outputDir: config.outDir,
        options: {},
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
        options: {},
      },
    ],
    [
      'injected/index.ts',
      {
        type: 'unlisted-script',
        name: 'injected',
        inputPath: resolve(config.entrypointsDir, 'injected/index.ts'),
        outputDir: config.outDir,
        options: {},
      },
    ],

    // unlisted-style
    [
      'iframe.scss',
      {
        type: 'unlisted-style',
        name: 'iframe',
        inputPath: resolve(config.entrypointsDir, 'iframe.scss'),
        outputDir: config.outDir,
        options: {},
      },
    ],
    [
      'iframe.css',
      {
        type: 'unlisted-style',
        name: 'iframe',
        inputPath: resolve(config.entrypointsDir, 'iframe.css'),
        outputDir: config.outDir,
        options: {},
      },
    ],

    // content-script-style
    [
      'content.css',
      {
        type: 'content-script-style',
        name: 'content',
        inputPath: resolve(config.entrypointsDir, 'content.css'),
        outputDir: resolve(config.outDir, 'content-scripts'),
        options: {},
      },
    ],
    [
      'overlay.content.css',
      {
        type: 'content-script-style',
        name: 'overlay',
        inputPath: resolve(config.entrypointsDir, 'overlay.content.css'),
        outputDir: resolve(config.outDir, 'content-scripts'),
        options: {},
      },
    ],
    [
      'content/index.css',
      {
        type: 'content-script-style',
        name: 'content',
        inputPath: resolve(config.entrypointsDir, 'content/index.css'),
        outputDir: resolve(config.outDir, 'content-scripts'),
        options: {},
      },
    ],
    [
      'overlay.content/index.css',
      {
        type: 'content-script-style',
        name: 'overlay',
        inputPath: resolve(config.entrypointsDir, 'overlay.content/index.css'),
        outputDir: resolve(config.outDir, 'content-scripts'),
        options: {},
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
    const expectedPaths = [
      'src/entrypoints/popup.html',
      'src/entrypoints/popup/index.html',
    ].map(unnormalizePath);

    await expect(() => findEntrypoints(config)).rejects.toThrowError(
      'Multiple entrypoints with the name "popup" detected, but only one is allowed: ' +
        expectedPaths.join(', '),
    );
  });

  describe('include option', () => {
    it("should filter out the background when include doesn't contain the target browser", async () => {
      globMock.mockResolvedValueOnce(['background.ts']);
      importTsFileMock.mockResolvedValue({
        include: ['not' + config.browser],
      });

      const entrypoints = await findEntrypoints(config);

      expect(entrypoints).toEqual([]);
    });

    it("should filter out content scripts when include doesn't contain the target browser", async () => {
      globMock.mockResolvedValueOnce(['example.content.ts']);
      importTsFileMock.mockResolvedValue({
        include: ['not' + config.browser],
      });

      const entrypoints = await findEntrypoints(config);

      expect(entrypoints).toEqual([]);
    });

    it("should filter out the popup when include doesn't contain the target browser", async () => {
      globMock.mockResolvedValueOnce(['popup.html']);
      readFileMock.mockResolvedValueOnce(
        `<html>
          <head>
            <meta name="manifest.include" content="['${
              'not' + config.browser
            }']" />
          </head>
        </html>`,
      );

      const entrypoints = await findEntrypoints(config);

      expect(entrypoints).toEqual([]);
    });

    it("should filter out the options page when include doesn't contain the target browser", async () => {
      globMock.mockResolvedValueOnce(['options.html']);
      readFileMock.mockResolvedValueOnce(
        `<html>
          <head>
            <meta name="manifest.include" content="['${
              'not' + config.browser
            }']" />
          </head>
        </html>`,
      );

      const entrypoints = await findEntrypoints(config);

      expect(entrypoints).toEqual([]);
    });

    it("should filter out an unlisted page when include doesn't contain the target browser", async () => {
      globMock.mockResolvedValueOnce(['unlisted.html']);
      readFileMock.mockResolvedValueOnce(
        `<html>
          <head>
            <meta name="manifest.include" content="['${
              'not' + config.browser
            }']" />
          </head>
        </html>`,
      );

      const entrypoints = await findEntrypoints(config);

      expect(entrypoints).toEqual([]);
    });
  });

  describe('exclude option', () => {
    it('should filter out the background when exclude contains the target browser', async () => {
      globMock.mockResolvedValueOnce(['background.ts']);
      importTsFileMock.mockResolvedValue({
        exclude: [config.browser],
      });

      const entrypoints = await findEntrypoints(config);

      expect(entrypoints).toEqual([]);
    });

    it('should filter out content scripts when exclude contains the target browser', async () => {
      globMock.mockResolvedValueOnce(['example.content.ts']);
      importTsFileMock.mockResolvedValue({
        exclude: [config.browser],
      });

      const entrypoints = await findEntrypoints(config);

      expect(entrypoints).toEqual([]);
    });

    it('should filter out the popup when exclude contains the target browser', async () => {
      globMock.mockResolvedValueOnce(['popup.html']);
      readFileMock.mockResolvedValueOnce(
        `<html>
          <head>
            <meta name="manifest.exclude" content="['${config.browser}']" />
          </head>
        </html>`,
      );

      const entrypoints = await findEntrypoints(config);

      expect(entrypoints).toEqual([]);
    });

    it('should filter out the options page when exclude contains the target browser', async () => {
      globMock.mockResolvedValueOnce(['options.html']);
      readFileMock.mockResolvedValueOnce(
        `<html>
          <head>
            <meta name="manifest.exclude" content="['${config.browser}']" />
          </head>
        </html>`,
      );

      const entrypoints = await findEntrypoints(config);

      expect(entrypoints).toEqual([]);
    });

    it('should filter out an unlisted page when exclude contains the target browser', async () => {
      globMock.mockResolvedValueOnce(['unlisted.html']);
      readFileMock.mockResolvedValueOnce(
        `<html>
          <head>
            <meta name="manifest.exclude" content="['${config.browser}']" />
          </head>
        </html>`,
      );

      const entrypoints = await findEntrypoints(config);

      expect(entrypoints).toEqual([]);
    });
  });
});
