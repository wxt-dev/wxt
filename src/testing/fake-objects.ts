/**
 * SHOULD ONLY BE IMPORTED IN TESTS.
 */
import { resolve } from 'path';
import {
  BackgroundEntrypoint,
  ContentScriptEntrypoint,
  GenericEntrypoint,
} from '..';
import { faker } from '@faker-js/faker';
import merge from 'lodash.merge';
import { Rollup } from 'vite';
import { Manifest } from 'webextension-polyfill';

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
  }));

export const fakeRollupOutputChunk = fakeObjectCreator<Rollup.OutputChunk>(
  () => ({
    type: 'chunk',
    code: '',
    dynamicImports: [],
    exports: [],
    facadeModuleId: faker.helpers.arrayElement([null, fakeFile()]),
    fileName: faker.string.alphanumeric(),
    implicitlyLoadedBefore: [],
    importedBindings: {},
    imports: [],
    isDynamicEntry: faker.datatype.boolean(),
    isEntry: faker.datatype.boolean(),
    isImplicitEntry: faker.datatype.boolean(),
    map: null,
    moduleIds: [],
    modules: {},
    name: faker.string.alpha(),
    referencedFiles: [],
    viteMetadata: {
      importedAssets: new Set(),
      importedCss: new Set(),
    },
  }),
);

export const fakeRollupOutputAsset = fakeObjectCreator<Rollup.OutputAsset>(
  () => ({
    type: 'asset',
    fileName: fakeFileName(),
    name: faker.string.alpha(),
    needsCodeReference: faker.datatype.boolean(),
    source: '',
  }),
);

export function fakeRollupOutput(): Rollup.OutputAsset | Rollup.OutputChunk {
  return faker.helpers.arrayElement([
    fakeRollupOutputAsset(),
    fakeRollupOutputChunk(),
  ]);
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
