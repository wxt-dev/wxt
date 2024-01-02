/**
 * SHOULD ONLY BE IMPORTED IN TESTS.
 */
import { resolve } from 'path';
import { faker } from '@faker-js/faker';
import merge from 'lodash.merge';
import type { Manifest } from '~/browser';
import {
  FsCache,
  InternalConfig,
  WxtDevServer,
  BackgroundEntrypoint,
  ContentScriptEntrypoint,
  GenericEntrypoint,
  OptionsEntrypoint,
  PopupEntrypoint,
  OutputChunk,
  OutputFile,
  OutputAsset,
  BuildOutput,
  BuildStepOutput,
} from '~/types';
import { mock } from 'vitest-mock-extended';

faker.seed(__TEST_SEED__);

type DeepPartial<T> = { [key in keyof T]+?: Partial<T[key]> };
function fakeObjectCreator<T>(base: () => T) {
  return (overrides?: DeepPartial<T>): T => merge(base(), overrides);
}

export function fakeFileName(): string {
  return faker.string.alphanumeric() + '.' + faker.string.alpha({ length: 3 });
}

export function fakeFile(root = process.cwd()): string {
  return resolve(root, fakeFileName());
}

export function fakeDir(root = process.cwd()): string {
  return resolve(root, faker.string.alphanumeric());
}

export const fakeEntrypoint = () =>
  faker.helpers.arrayElement([
    fakePopupEntrypoint,
    fakeGenericEntrypoint,
    fakeOptionsEntrypoint,
    fakeBackgroundEntrypoint,
    fakeContentScriptEntrypoint,
    fakeUnlistedScriptEntrypoint,
  ])();

export const fakeContentScriptEntrypoint =
  fakeObjectCreator<ContentScriptEntrypoint>(() => ({
    type: 'content-script',
    inputPath: fakeFile('src'),
    name: faker.string.alpha(),
    options: {
      matches: [],
      matchAboutBlank: faker.helpers.arrayElement([true, false, undefined]),
      matchOriginAsFallback: faker.helpers.arrayElement([
        true,
        false,
        undefined,
      ]),
      runAt: faker.helpers.arrayElement([
        'document_start',
        'document_end',
        'document_idle',
        undefined,
      ]),
    },
    outputDir: fakeDir('.output'),
  }));

export const fakeBackgroundEntrypoint = fakeObjectCreator<BackgroundEntrypoint>(
  () => ({
    type: 'background',
    inputPath: fakeFile('src'),
    name: faker.string.alpha(),
    options: {
      persistent: faker.helpers.arrayElement([true, false, undefined]),
      type: faker.helpers.maybe(() => 'module'),
    },
    outputDir: fakeDir('.output'),
  }),
);

export const fakeUnlistedScriptEntrypoint =
  fakeObjectCreator<GenericEntrypoint>(() => ({
    type: 'unlisted-script',
    inputPath: fakeFile('src'),
    name: faker.string.alpha(),
    outputDir: fakeDir('.output'),
    options: {},
  }));

export const fakeOptionsEntrypoint = fakeObjectCreator<OptionsEntrypoint>(
  () => ({
    type: 'options',
    inputPath: fakeFile('src'),
    name: faker.string.alpha(),
    outputDir: fakeDir('.output'),
    options: {
      browserStyle: faker.helpers.arrayElement([true, false, undefined]),
      chromeStyle: faker.helpers.arrayElement([true, false, undefined]),
      openInTab: faker.helpers.arrayElement([true, false, undefined]),
    },
  }),
);

export const fakePopupEntrypoint = fakeObjectCreator<PopupEntrypoint>(() => ({
  type: 'popup',
  inputPath: fakeFile('src'),
  name: faker.string.alpha(),
  outputDir: fakeDir('.output'),
  options: {
    defaultTitle: faker.helpers.arrayElement([
      faker.person.fullName(),
      undefined,
    ]),
    defaultIcon: faker.helpers.arrayElement([
      {
        '16': 'icon/16.png',
        '24': 'icon/24.png',
        '64': 'icon/64.png',
      },
    ]),
    mv2Key: faker.helpers.arrayElement([
      'browser_action',
      'page_action',
      undefined,
    ]),
  },
}));

export const fakeGenericEntrypoint = fakeObjectCreator<GenericEntrypoint>(
  () => ({
    type: faker.helpers.arrayElement([
      'sandbox',
      'bookmarks',
      'history',
      'newtab',
      'sidepanel',
      'devtools',
      'unlisted-page',
      'unlisted-script',
    ]),
    inputPath: fakeFile('src'),
    name: faker.string.alpha(),
    outputDir: fakeDir('.output'),
    options: {},
  }),
);

export const fakeOutputChunk = fakeObjectCreator<OutputChunk>(() => ({
  type: 'chunk',
  fileName: faker.string.alphanumeric(),
  moduleIds: [],
}));

export const fakeOutputAsset = fakeObjectCreator<OutputAsset>(() => ({
  type: 'asset',
  fileName: fakeFileName(),
}));

export function fakeOutputFile(): OutputFile {
  return faker.helpers.arrayElement([fakeOutputAsset(), fakeOutputChunk()]);
}

export const fakeManifest = fakeObjectCreator<Manifest.WebExtensionManifest>(
  () => ({
    manifest_version: faker.helpers.arrayElement([2, 3]),
    name: faker.string.alphanumeric(),
    version: `${faker.number.int()}.${faker.number.int()}.${faker.number.int()}`,
  }),
);

export function fakeArray<T>(createItem: () => T, count = 3): T[] {
  const array: T[] = [];
  for (let i = 0; i < count; i++) {
    array.push(createItem());
  }
  return array;
}

export const fakeInternalConfig = fakeObjectCreator<InternalConfig>(() => {
  const browser = faker.helpers.arrayElement(['chrome', 'firefox']);
  const command = faker.helpers.arrayElement(['build', 'serve'] as const);
  const manifestVersion = faker.helpers.arrayElement([2, 3] as const);
  const mode = faker.helpers.arrayElement(['development', 'production']);

  return {
    browser,
    command,
    entrypointsDir: fakeDir(),
    env: { browser, command, manifestVersion, mode },
    fsCache: mock<FsCache>(),
    imports: {},
    logger: mock(),
    manifest: fakeManifest(),
    manifestVersion,
    mode,
    outBaseDir: fakeDir(),
    outDir: fakeDir(),
    publicDir: fakeDir(),
    root: fakeDir(),
    runnerConfig: {
      config: {},
    },
    debug: faker.datatype.boolean(),
    srcDir: fakeDir(),
    typesDir: fakeDir(),
    wxtDir: fakeDir(),
    server: mock<WxtDevServer>(),
    analysis: {
      enabled: false,
      template: 'treemap',
    },
    zip: {
      artifactTemplate: '{{name}}-{{version}}.zip',
      ignoredSources: [],
      sourcesRoot: fakeDir(),
      sourcesTemplate: '{{name}}-sources.zip',
      name: faker.person.firstName().toLowerCase(),
    },
    transformManifest: () => {},
    userConfigMetadata: {},
    alias: {},
    experimental: {
      includeBrowserPolyfill: true,
    },
    builder: mock(),
  };
});

export const fakeBuildOutput = fakeObjectCreator<BuildOutput>(() => ({
  manifest: fakeManifest(),
  publicAssets: fakeArray(fakeOutputAsset),
  steps: fakeArray(fakeBuildStepOutput),
}));

export const fakeBuildStepOutput = fakeObjectCreator<BuildStepOutput>(() => ({
  chunks: fakeArray(fakeOutputChunk),
  entrypoints: fakeArray(fakeEntrypoint),
}));
