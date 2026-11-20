/** SHOULD ONLY BE IMPORTED IN TESTS. */
import { resolve } from 'path';

import type { Browser } from '@wxt-dev/browser';
import { vi } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { setWxtForTesting } from '../../internal/wxt';
import {
  FsCache,
  ResolvedConfig,
  WxtDevServer,
  BackgroundEntrypoint,
  ContentScriptEntrypoint,
  GenericEntrypoint,
  OptionsEntrypoint,
  PopupEntrypoint,
  OutputChunk,
  OutputAsset,
  BuildOutput,
  BuildStepOutput,
  UserManifest,
  Wxt,
  SidepanelEntrypoint,
  BaseEntrypoint,
  UnlistedScriptEntrypoint,
} from '../../types';
import { resolveActualBrowser } from '../target-browser';

// Seeded PRNG (mulberry32) so failures can be reproduced with the same seed.
let seedState = __TEST_SEED__ >>> 0;
function random(): number {
  seedState = (seedState + 0x6d2b79f5) >>> 0;
  let t = seedState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const ALPHA = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHANUMERIC = ALPHA + '0123456789';
const FIRST_NAMES = ['Alex', 'Blake', 'Casey', 'Drew', 'Emery', 'Finley'];
const LAST_NAMES = ['Adams', 'Brooks', 'Chen', 'Dunn', 'Evans', 'Fischer'];

function randomBoolean(): boolean {
  return random() < 0.5;
}

function randomInt(min = 0, max = Number.MAX_SAFE_INTEGER): number {
  return min + Math.floor(random() * (max - min + 1));
}

function arrayElement<T>(array: readonly T[]): T {
  return array[randomInt(0, array.length - 1)];
}

function randomString(chars: string, length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) result += arrayElement([...chars]);
  return result;
}

const randomAlpha = (length = 1) => randomString(ALPHA, length);
const randomAlphanumeric = (length = 1) => randomString(ALPHANUMERIC, length);
const maybe = <T>(fn: () => T): T | undefined =>
  randomBoolean() ? fn() : undefined;
const firstName = () => arrayElement(FIRST_NAMES);
const fullName = () =>
  `${arrayElement(FIRST_NAMES)} ${arrayElement(LAST_NAMES)}`;

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

// Not using `@aklinker1/zero-factory` or similar because bases contain mocks
// (`vi.fn()`, `mock()`) that must be kept as-is, not called or recursed into.
function isPlainObject(value: unknown): value is Record<string, any> {
  if (value == null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
function deepMerge(base: any, overrides: any): any {
  if (!isPlainObject(base) || !isPlainObject(overrides))
    return overrides === undefined ? base : overrides;
  // Mutate `base` instead of copying so mocks (proxies) keep their behavior
  for (const key of Object.keys(overrides)) {
    base[key] = deepMerge(base[key], overrides[key]);
  }
  return base;
}
function fakeObjectCreator<T>(base: () => T) {
  return (overrides?: DeepPartial<T>): T => deepMerge(base(), overrides);
}

export function fakeFileName(): string {
  return randomAlphanumeric() + '.' + randomAlpha(3);
}

export function fakeFile(root = process.cwd()): string {
  return resolve(root, fakeFileName());
}

export function fakeDir(root = process.cwd()): string {
  return resolve(root, randomAlphanumeric());
}

export const fakeEntrypoint = (options?: DeepPartial<BaseEntrypoint>) =>
  arrayElement([
    fakePopupEntrypoint,
    fakeGenericEntrypoint,
    fakeOptionsEntrypoint,
    fakeBackgroundEntrypoint,
    fakeContentScriptEntrypoint,
    fakeUnlistedScriptEntrypoint,
  ])(options);

export const fakeContentScriptEntrypoint =
  fakeObjectCreator<ContentScriptEntrypoint>(() => ({
    type: 'content-script',
    inputPath: fakeFile('src'),
    name: randomAlpha(),
    options: {
      matches: [],
      matchAboutBlank: randomBoolean(),
      matchOriginAsFallback: arrayElement([true, false, undefined]),
      runAt: arrayElement([
        'document_start',
        'document_end',
        'document_idle',
        undefined,
      ]),
    },
    outputDir: fakeDir('.output'),
    skipped: randomBoolean(),
  }));

export const fakeBackgroundEntrypoint = fakeObjectCreator<BackgroundEntrypoint>(
  () => ({
    type: 'background',
    inputPath: 'entrypoints/background.ts',
    name: 'background',
    options: {
      persistent: randomBoolean(),
      type: maybe(() => 'module'),
    },
    outputDir: fakeDir('.output'),
    skipped: randomBoolean(),
  }),
);

export const fakeUnlistedScriptEntrypoint =
  fakeObjectCreator<UnlistedScriptEntrypoint>(() => ({
    type: 'unlisted-script',
    inputPath: fakeFile('src'),
    name: randomAlpha(),
    outputDir: fakeDir('.output'),
    options: {},
    skipped: randomBoolean(),
  }));

export const fakeOptionsEntrypoint = fakeObjectCreator<OptionsEntrypoint>(
  () => ({
    type: 'options',
    inputPath: 'entrypoints/options.html',
    name: 'options',
    outputDir: fakeDir('.output'),
    options: {
      browserStyle: randomBoolean(),
      chromeStyle: randomBoolean(),
      openInTab: randomBoolean(),
    },
    skipped: randomBoolean(),
  }),
);

export const fakePopupEntrypoint = fakeObjectCreator<PopupEntrypoint>(() => ({
  type: 'popup',
  inputPath: 'entrypoints/popup.html',
  name: 'popup',
  outputDir: fakeDir('.output'),
  options: {
    defaultTitle: arrayElement([fullName(), undefined]),
    defaultIcon: arrayElement([
      {
        '16': 'icon/16.png',
        '24': 'icon/24.png',
        '64': 'icon/64.png',
      },
    ]),
    actionType: arrayElement(['browser_action', 'page_action', undefined]),
    // Firefox-specific options - kept undefined by default to avoid breaking existing tests
    browserStyle: undefined,
    defaultArea: undefined,
    themeIcons: undefined,
  },
  skipped: randomBoolean(),
}));

export const fakeSidepanelEntrypoint = fakeObjectCreator<SidepanelEntrypoint>(
  () => ({
    type: 'sidepanel',
    inputPath: 'entrypoints/sidepanel.html',
    name: 'sidepanel',
    outputDir: fakeDir('.output'),
    options: {
      defaultTitle: arrayElement([fullName(), undefined]),
      defaultIcon: arrayElement([
        {
          '16': 'icon/16.png',
          '24': 'icon/24.png',
          '64': 'icon/64.png',
        },
      ]),
      openAtInstall: arrayElement([true, false, undefined]),
    },
    skipped: randomBoolean(),
  }),
);

export const fakeGenericEntrypoint = fakeObjectCreator<GenericEntrypoint>(
  () => ({
    type: arrayElement([
      'sandbox',
      'bookmarks',
      'history',
      'newtab',
      'devtools',
      'unlisted-page',
    ]),
    inputPath: fakeFile('src'),
    name: randomAlpha(),
    outputDir: fakeDir('.output'),
    options: {},
    skipped: randomBoolean(),
  }),
);

export const fakeOutputChunk = fakeObjectCreator<OutputChunk>(() => ({
  type: 'chunk',
  fileName: randomAlphanumeric(),
  moduleIds: [],
}));

export const fakeOutputAsset = fakeObjectCreator<OutputAsset>(() => ({
  type: 'asset',
  fileName: fakeFileName(),
}));

export const fakeManifest = fakeObjectCreator<Browser.runtime.Manifest>(() => ({
  manifest_version: arrayElement([2, 3]),
  name: randomAlphanumeric(),
  version: `${randomInt()}.${randomInt()}.${randomInt()}`,
}));

export const fakeUserManifest = fakeObjectCreator<UserManifest>(() => ({
  name: randomAlphanumeric(),
  version: `${randomInt()}.${randomInt()}.${randomInt()}`,
}));

export function fakeArray<T>(createItem: () => T, count = 3): T[] {
  const array: T[] = [];
  for (let i = 0; i < count; i++) {
    array.push(createItem());
  }
  return array;
}

export const fakeResolvedConfig = fakeObjectCreator<ResolvedConfig>(() => {
  const browser = arrayElement(['chrome', 'firefox']);
  const command = arrayElement(['build', 'serve'] as const);
  const manifestVersion = arrayElement([2, 3] as const);
  const mode = arrayElement(['development', 'production']);

  return {
    browser,
    actualBrowser: resolveActualBrowser(browser),
    targetBrowsers: [],
    command,
    entrypointsDir: fakeDir(),
    modulesDir: fakeDir(),
    builtinModules: [],
    userModules: [],
    env: { browser, command, manifestVersion, mode },
    fsCache: mock<FsCache>(),
    imports: {
      disabled: randomBoolean(),
      eslintrc: {
        enabled: arrayElement([false, 8, 9]),
        filePath: fakeFile(),
        globalsPropValue: arrayElement([
          true,
          false,
          'readable',
          'readonly',
          'writable',
          'writeable',
        ] as const),
      },
    },
    logger: mock(),
    manifest: fakeUserManifest(),
    manifestVersion,
    mode,
    outBaseDir: fakeDir(),
    outDir: fakeDir(),
    publicDir: fakeDir(),
    root: fakeDir(),
    wxtModuleDir: fakeDir(),
    webExt: {
      config: {},
    },
    runner: mock(),
    debug: randomBoolean(),
    srcDir: fakeDir(),
    typesDir: fakeDir(),
    wxtDir: fakeDir(),
    analysis: {
      enabled: false,
      open: false,
      template: 'treemap',
      outputFile: fakeFile(),
      outputDir: fakeDir(),
      outputName: 'stats',
      keepArtifacts: false,
    },
    zip: {
      artifactTemplate: '{{name}}-{{version}}.zip',
      includeSources: [],
      excludeSources: [],
      dotSources: false,
      exclude: [],
      sourcesRoot: fakeDir(),
      sourcesTemplate: '{{name}}-sources.zip',
      name: firstName().toLowerCase(),
      downloadedPackagesDir: fakeDir(),
      downloadPackages: [],
      compressionLevel: 9,
      zipSources: false,
    },
    userConfigMetadata: {},
    alias: {},
    experimental: {
      escapeUnicode: false,
    },
    watchOptions: {},
    dev: {
      reloadCommand: 'Alt+R',
    },
    hooks: {},
    vite: () => ({}),
    plugins: [],
    suppressWarnings: {},
  };
});

export const fakeWxt = fakeObjectCreator<Wxt>(() => ({
  config: fakeResolvedConfig(),
  hook: vi.fn(),
  hooks: mock(),
  logger: mock(),
  reloadConfig: vi.fn(),
  pm: mock(),
  server: arrayElement([undefined, fakeWxtDevServer()]),
  builder: mock(),
  entrypointFinder: mock({
    findEntrypoints: () => [],
  }),
  runner: mock(),
}));

export const fakeWxtDevServer = fakeObjectCreator<WxtDevServer>(() => ({
  currentOutput: fakeBuildOutput(),
  host: 'localhost',
  port: 3000,
  origin: 'http://localhost:3000',
  reloadContentScript: vi.fn(),
  reloadExtension: vi.fn(),
  reloadPage: vi.fn(),
  restart: vi.fn(),
  restartBrowser: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  transformHtml: vi.fn(),
  watcher: mock(),
  ws: mock(),
}));

export function setFakeWxt(overrides?: DeepPartial<Wxt>) {
  const wxt = fakeWxt(overrides);
  // Mirror resolveConfig: `actualBrowser` is resolved from `browser` unless
  // the test overrides it directly.
  if (overrides?.config?.actualBrowser == null) {
    wxt.config.actualBrowser = resolveActualBrowser(wxt.config.browser);
  }
  setWxtForTesting(wxt);
  return wxt;
}

export const fakeBuildOutput = fakeObjectCreator<BuildOutput>(() => ({
  manifest: fakeManifest(),
  publicAssets: fakeArray(fakeOutputAsset),
  steps: fakeArray(fakeBuildStepOutput),
}));

export const fakeBuildStepOutput = fakeObjectCreator<BuildStepOutput>(() => ({
  chunks: fakeArray(fakeOutputChunk),
  entrypoints: fakeArray(fakeEntrypoint),
}));

export const fakeManifestCommand = fakeObjectCreator<Browser.commands.Command>(
  () => ({
    description: randomAlphanumeric(10),
    suggested_key: {
      default: `${arrayElement(['ctrl', 'alt'])}+${randomInt(0, 9)}`,
    },
  }),
);

export const fakeDevServer = fakeObjectCreator<WxtDevServer>(() => ({
  host: 'localhost',
  port: 5173,
  origin: 'http://localhost:3000',
  reloadContentScript: vi.fn(),
  reloadExtension: vi.fn(),
  reloadPage: vi.fn(),
  restart: vi.fn(),
  restartBrowser: vi.fn(),
  stop: vi.fn(),
  start: vi.fn(),
  watcher: mock(),
  transformHtml: vi.fn(),
  ws: mock(),
  currentOutput: undefined,
}));
