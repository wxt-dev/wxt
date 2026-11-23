import { describe, expect, it } from 'vitest';

import {
  parseXcproj,
  patchXcproj,
  serializeXcproj,
  type XcprojProject,
} from '../xcproj';

const SETTINGS = {
  appCategory: 'public.app-category.productivity',
  bundleIdentifier: 'com.example.app',
  developmentTeam: 'ABCDE12345',
  version: '1.2.3',
  projectVersion: 10203,
};

function project(): XcprojProject {
  const target = (name: string, productType: string, bundleId: string) => ({
    name,
    'product-type': productType,
    'build-settings': {
      CURRENT_PROJECT_VERSION: '1',
      INFOPLIST_KEY_CFBundleDisplayName: name,
      MARKETING_VERSION: '1.0',
      PRODUCT_BUNDLE_IDENTIFIER: bundleId,
      SWIFT_VERSION: '5.0',
    },
  });
  return {
    targets: [
      target('App (iOS)', 'application', 'com.example.App'),
      target('App (macOS)', 'application', 'com.example.App'),
      target('App Extension (iOS)', 'app-extension', 'com.example.app'),
      target('App Extension (macOS)', 'app-extension', 'com.example.app'),
    ],
    'build-settings': {
      COPY_PHASE_STRIP: 'NO',
      GCC_WARN_UNUSED_VARIABLE: 'YES',
    },
    'last-upgrade': '27.2',
  };
}

const settingsOf = (patched: XcprojProject, index: number) =>
  patched.targets![index]!['build-settings']!;

describe('parseXcproj', () => {
  it('reads a file with trailing commas', () => {
    const text = `{
  "configurations": [
    "Debug",
    "Release",
  ],
  "targets": [
    { "name": "App", "build-settings": { "SWIFT_VERSION": "5.0", }, },
  ],
}`;
    expect(parseXcproj(text)).toEqual({
      configurations: ['Debug', 'Release'],
      targets: [{ name: 'App', 'build-settings': { SWIFT_VERSION: '5.0' } }],
    });
  });

  it('leaves commas and brackets inside strings alone', () => {
    const text = `{ "a": "x, ]", "b": "say \\"hi\\", }", "c": ["1,", "2"], }`;
    expect(parseXcproj(text)).toEqual({
      a: 'x, ]',
      b: 'say "hi", }',
      c: ['1,', '2'],
    });
  });

  it('reads strict JSON unchanged', () => {
    expect(parseXcproj('{"a":[1,2],"b":{"c":"d"}}')).toEqual({
      a: [1, 2],
      b: { c: 'd' },
    });
  });

  it('round-trips through serializeXcproj', () => {
    const original = project();
    expect(parseXcproj(serializeXcproj(original))).toEqual(original);
  });
});

describe('patchXcproj', () => {
  it('gives each app the configured id and each extension a prefixed one', () => {
    const patched = patchXcproj(project(), SETTINGS);
    expect(
      patched.targets!.map(
        (t) => t['build-settings']!.PRODUCT_BUNDLE_IDENTIFIER,
      ),
    ).toEqual([
      'com.example.app',
      'com.example.app',
      'com.example.app.Extension',
      'com.example.app.Extension',
    ]);
  });

  it('sets the version and build number on every app and extension', () => {
    const patched = patchXcproj(project(), SETTINGS);
    for (let i = 0; i < 4; i++) {
      expect(settingsOf(patched, i).MARKETING_VERSION).toBe('1.2.3');
      expect(settingsOf(patched, i).CURRENT_PROJECT_VERSION).toBe('10203');
    }
  });

  it('puts the store metadata on the apps only', () => {
    const patched = patchXcproj(project(), SETTINGS);
    expect(settingsOf(patched, 0).INFOPLIST_KEY_LSApplicationCategoryType).toBe(
      'public.app-category.productivity',
    );
    expect(
      settingsOf(patched, 0).INFOPLIST_KEY_ITSAppUsesNonExemptEncryption,
    ).toBe('NO');
    expect(
      settingsOf(patched, 2).INFOPLIST_KEY_LSApplicationCategoryType,
    ).toBeUndefined();
    expect(
      settingsOf(patched, 2).INFOPLIST_KEY_ITSAppUsesNonExemptEncryption,
    ).toBeUndefined();
  });

  it('sets the category and team project-wide', () => {
    const patched = patchXcproj(project(), SETTINGS);
    expect(patched['build-settings']).toMatchObject({
      DEVELOPMENT_TEAM: 'ABCDE12345',
      INFOPLIST_KEY_LSApplicationCategoryType:
        'public.app-category.productivity',
    });
  });

  it('leaves the team out when none is configured', () => {
    const patched = patchXcproj(project(), {
      ...SETTINGS,
      developmentTeam: undefined,
    });
    expect(patched['build-settings']).not.toHaveProperty('DEVELOPMENT_TEAM');
  });

  it('overwrites per-configuration values instead of adding a plain one beside them', () => {
    const input = project();
    const build = input.targets![0]!['build-settings']!;
    delete build.PRODUCT_BUNDLE_IDENTIFIER;
    build['PRODUCT_BUNDLE_IDENTIFIER[config=Debug]'] = 'com.example.App.debug';
    build['PRODUCT_BUNDLE_IDENTIFIER[config=Release]'] = 'com.example.App';

    const patched = settingsOf(patchXcproj(input, SETTINGS), 0);
    expect(patched['PRODUCT_BUNDLE_IDENTIFIER[config=Debug]']).toBe(
      'com.example.app',
    );
    expect(patched['PRODUCT_BUNDLE_IDENTIFIER[config=Release]']).toBe(
      'com.example.app',
    );
    expect(patched).not.toHaveProperty('PRODUCT_BUNDLE_IDENTIFIER');
  });

  it('ignores targets that are neither an app nor an app extension', () => {
    const input = project();
    input.targets!.push({
      name: 'AppTests',
      'product-type': 'unit-test-bundle',
      'build-settings': { MARKETING_VERSION: '1.0' },
    });
    const patched = patchXcproj(input, SETTINGS);
    expect(settingsOf(patched, 4)).toEqual({ MARKETING_VERSION: '1.0' });
  });

  it('keeps build settings in key order and everything else untouched', () => {
    const patched = patchXcproj(project(), SETTINGS);
    const keys = Object.keys(settingsOf(patched, 0));
    expect(keys).toEqual([...keys].sort());
    expect(settingsOf(patched, 0).SWIFT_VERSION).toBe('5.0');
    expect(patched['last-upgrade']).toBe('27.2');
  });

  it('is idempotent', () => {
    const once = patchXcproj(project(), SETTINGS);
    expect(patchXcproj(structuredClone(once), SETTINGS)).toEqual(once);
  });

  it('copes with a project that has no targets or settings', () => {
    expect(patchXcproj({}, SETTINGS)['build-settings']).toMatchObject({
      DEVELOPMENT_TEAM: 'ABCDE12345',
    });
  });
});
