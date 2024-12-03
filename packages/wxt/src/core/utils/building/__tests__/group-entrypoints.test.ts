import { describe, expect, it } from 'vitest';
import { Entrypoint } from '../../../../types';
import { groupEntrypoints } from '../group-entrypoints';
import {
  fakeBackgroundEntrypoint,
  fakeGenericEntrypoint,
  fakePopupEntrypoint,
} from '../../testing/fake-objects';

const background: Entrypoint = {
  type: 'background',
  name: 'background',
  inputPath: '/background.ts',
  outputDir: '/.output/background',
  options: {},
  skipped: false,
};
const contentScript: Entrypoint = {
  type: 'content-script',
  name: 'overlay',
  inputPath: '/overlay.content.ts',
  outputDir: '/.output/content-scripts/overlay',
  options: {
    matches: ['<all_urls>'],
  },
  skipped: false,
};
const unlistedScript: Entrypoint = {
  type: 'unlisted-script',
  name: 'injected',
  inputPath: '/injected.ts',
  outputDir: '/.output/injected',
  options: {},
  skipped: false,
};
const popup: Entrypoint = {
  type: 'popup',
  name: 'popup',
  inputPath: '/popup.html',
  outputDir: '/.output/popup',
  options: {},
  skipped: false,
};
const unlistedPage: Entrypoint = {
  type: 'unlisted-page',
  name: 'onboarding',
  inputPath: '/onboarding.html',
  outputDir: '/.output/onboarding',
  options: {},
  skipped: false,
};
const options: Entrypoint = {
  type: 'options',
  name: 'options',
  inputPath: '/options.html',
  outputDir: '/.output/options',
  options: {},
  skipped: false,
};
const sandbox1: Entrypoint = {
  type: 'sandbox',
  name: 'sandbox',
  inputPath: '/sandbox1.html',
  outputDir: '/.output/sandbox1',
  options: {},
  skipped: false,
};
const sandbox2: Entrypoint = {
  type: 'sandbox',
  name: 'sandbox2',
  inputPath: '/sandbox2.html',
  outputDir: '/.output/sandbox2',
  options: {},
  skipped: false,
};
const unlistedStyle: Entrypoint = {
  type: 'unlisted-style',
  name: 'injected',
  inputPath: '/injected.scss',
  outputDir: '/.output',
  options: {},
  skipped: false,
};
const contentScriptStyle: Entrypoint = {
  type: 'content-script-style',
  name: 'injected',
  inputPath: '/overlay.content.scss',
  outputDir: '/.output/content-scripts',
  options: {},
  skipped: false,
};

describe('groupEntrypoints', () => {
  it('should keep scripts separate', () => {
    const entrypoints: Entrypoint[] = [
      contentScript,
      background,
      unlistedScript,
      popup,
    ];
    const expected = [contentScript, background, unlistedScript, [popup]];

    const actual = groupEntrypoints(entrypoints);

    expect(actual).toEqual(expected);
  });

  it('should keep styles separate', () => {
    const entrypoints: Entrypoint[] = [
      unlistedStyle,
      contentScriptStyle,
      popup,
    ];
    const expected = [unlistedStyle, contentScriptStyle, [popup]];

    const actual = groupEntrypoints(entrypoints);

    expect(actual).toEqual(expected);
  });

  it('should group extension pages together', () => {
    const entrypoints: Entrypoint[] = [
      popup,
      background,
      unlistedPage,
      options,
      sandbox1,
    ];
    const expected = [[popup, unlistedPage, options], background, [sandbox1]];

    const actual = groupEntrypoints(entrypoints);

    expect(actual).toEqual(expected);
  });

  it('should group sandbox pages together', () => {
    const entrypoints: Entrypoint[] = [
      sandbox1,
      popup,
      sandbox2,
      contentScript,
    ];
    const expected = [[sandbox1, sandbox2], [popup], contentScript];

    const actual = groupEntrypoints(entrypoints);

    expect(actual).toEqual(expected);
  });

  it('should group ESM compatible scripts with extension pages', () => {
    const background = fakeBackgroundEntrypoint({
      options: {
        type: 'module',
      },
      skipped: false,
    });
    const popup = fakePopupEntrypoint({
      skipped: false,
    });
    const sandbox = fakeGenericEntrypoint({
      inputPath: '/entrypoints/sandbox.html',
      name: 'sandbox',
      type: 'sandbox',
      skipped: false,
    });

    const actual = groupEntrypoints([background, popup, sandbox]);

    expect(actual).toEqual([[background, popup], [sandbox]]);
  });

  it('should exclude skipped entrypoints from the groups to build', () => {
    const background = fakeBackgroundEntrypoint({
      options: {
        type: 'module',
      },
      skipped: false,
    });
    const popup = fakePopupEntrypoint({
      skipped: true,
    });
    const sandbox = fakeGenericEntrypoint({
      inputPath: '/entrypoints/sandbox.html',
      name: 'sandbox',
      type: 'sandbox',
      skipped: false,
    });

    const actual = groupEntrypoints([background, popup, sandbox]);

    expect(actual).toEqual([[background], [sandbox]]);
  });

  it.todo(
    'should group ESM compatible sandbox scripts with sandbox pages',
    () => {
      // Main world content scripts
    },
  );
});
