import { describe, expect, it } from 'vitest';

import {
  applyBundleIds,
  parseProjectVersion,
  resolveBundleIds,
} from '../xcode';

describe('parseProjectVersion', () => {
  it('encodes major/minor/patch into a single integer', () => {
    expect(parseProjectVersion('1.2.3')).toBe(10203);
    expect(parseProjectVersion('0.1.0')).toBe(100);
  });

  it('handles 1-part and 2-part versions', () => {
    expect(parseProjectVersion('1.0')).toBe(10000);
    expect(parseProjectVersion('1')).toBe(10000);
  });

  it('strips optional leading v and prerelease/build metadata', () => {
    expect(parseProjectVersion('1.0.0-beta.1')).toBe(10000);
    expect(parseProjectVersion('v1.2.3+meta')).toBe(10203);
  });

  it('throws a clear error on invalid versions', () => {
    expect(() => parseProjectVersion('')).toThrow(/Invalid version/);
    expect(() => parseProjectVersion('abc')).toThrow(/Invalid version/);
    expect(() => parseProjectVersion('1.2.3.4')).toThrow(/Invalid version/);
    expect(() => parseProjectVersion('1.-2.0')).toThrow(/Invalid version/);
  });
});

function objects(
  targets: { name: string; productType: string; configIds: [string, string] }[],
) {
  const map: Record<string, unknown> = {};
  targets.forEach((target, i) => {
    const listId = `LIST${i}`;
    map[`TARGET${i}`] = {
      isa: 'PBXNativeTarget',
      name: target.name,
      productType: `com.apple.product-type.${target.productType}`,
      buildConfigurationList: listId,
    };
    map[listId] = {
      isa: 'XCConfigurationList',
      buildConfigurations: target.configIds,
    };
  });
  return map as Record<
    string,
    {
      isa?: string;
      productType?: string;
      buildConfigurationList?: string;
      buildConfigurations?: string[];
    }
  >;
}

const APP_DEBUG = 'AAAAAAAAAAAAAAAAAAAAAAA1';
const EXT_DEBUG = 'EEEEEEEEEEEEEEEEEEEEEEE1';
const UNRELATED = 'CCCCCCCCCCCCCCCCCCCCCCC1';

function pbxproj(
  configs: { id: string; name: string; bundleId: string; comment?: string }[],
): string {
  const write = (id: string) => (/^[A-Za-z0-9._]+$/.test(id) ? id : `"${id}"`);
  return [
    '/* Begin XCBuildConfiguration section */',
    ...configs.flatMap((c) => [
      `\t\t${c.id} /* ${c.comment ?? c.name} */ = {`,
      '\t\t\t' + 'isa = XCBuildConfiguration;',
      `\t\t\tbuildSettings = {`,
      `\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = ${write(c.bundleId)};`,
      `\t\t\t\tSWIFT_VERSION = 5.0;`,
      `\t\t\t};`,
      `\t\t\tname = ${c.name};`,
      `\t\t};`,
    ]),
    '/* End XCBuildConfiguration section */',
  ].join('\n');
}

const idsInFile = (content: string) =>
  [...content.matchAll(/PRODUCT_BUNDLE_IDENTIFIER = ("[^"]*"|[^;]+);/g)].map(
    (m) => m[1]!.replace(/"/g, ''),
  );

describe('resolveBundleIds', () => {
  it('gives the app the configured id and its extension a prefixed one', () => {
    const desired = resolveBundleIds(
      objects([
        {
          name: 'Inbox Notifier for Gmail',
          productType: 'application',
          configIds: ['APP_DEBUG', 'APP_RELEASE'],
        },
        {
          name: 'Inbox Notifier for Gmail Extension',
          productType: 'app-extension',
          configIds: ['EXT_DEBUG', 'EXT_RELEASE'],
        },
      ]),
      'com.rxliuli.gmail-notifier',
    );
    expect(Object.fromEntries(desired)).toEqual({
      APP_DEBUG: 'com.rxliuli.gmail-notifier',
      APP_RELEASE: 'com.rxliuli.gmail-notifier',
      EXT_DEBUG: 'com.rxliuli.gmail-notifier.Extension',
      EXT_RELEASE: 'com.rxliuli.gmail-notifier.Extension',
    });
  });

  it('gives both platforms of a macOS+iOS project the same pair of ids', () => {
    const desired = resolveBundleIds(
      objects([
        {
          name: 'App (macOS)',
          productType: 'application',
          configIds: ['MAC_D', 'MAC_R'],
        },
        {
          name: 'App (iOS)',
          productType: 'application',
          configIds: ['IOS_D', 'IOS_R'],
        },
        {
          name: 'App Extension (macOS)',
          productType: 'app-extension',
          configIds: ['MAC_EXT_D', 'MAC_EXT_R'],
        },
        {
          name: 'App Extension (iOS)',
          productType: 'app-extension',
          configIds: ['IOS_EXT_D', 'IOS_EXT_R'],
        },
      ]),
      'com.example.app',
    );
    expect(desired.get('MAC_D')).toBe('com.example.app');
    expect(desired.get('IOS_D')).toBe('com.example.app');
    expect(desired.get('MAC_EXT_D')).toBe('com.example.app.Extension');
    expect(desired.get('IOS_EXT_D')).toBe('com.example.app.Extension');
  });

  it('ignores targets that are neither an app nor an app extension', () => {
    const desired = resolveBundleIds(
      objects([
        {
          name: 'App',
          productType: 'application',
          configIds: ['APP_D', 'APP_R'],
        },
        {
          name: 'AppTests',
          productType: 'bundle.unit-test',
          configIds: ['TEST_D', 'TEST_R'],
        },
      ]),
      'com.example.app',
    );
    expect([...desired.keys()].sort()).toEqual(['APP_D', 'APP_R']);
  });

  it('resolves nothing from an empty or unrecognized objects map', () => {
    expect(resolveBundleIds({}, 'com.example.app').size).toBe(0);
    expect(
      resolveBundleIds({ X: { isa: 'PBXGroup' } }, 'com.example.app').size,
    ).toBe(0);
  });

  it('skips a target whose configuration list is missing', () => {
    const broken = {
      T: {
        isa: 'PBXNativeTarget',
        productType: 'com.apple.product-type.application',
        buildConfigurationList: 'GONE',
      },
    };
    expect(resolveBundleIds(broken, 'com.example.app').size).toBe(0);
  });
});

describe('applyBundleIds', () => {
  it('rewrites only the configurations it was given', () => {
    const content = pbxproj([
      {
        id: APP_DEBUG,
        name: 'Debug',
        bundleId: 'com.rxliuli.Inbox-Notifier-for-Gmail',
      },
      { id: EXT_DEBUG, name: 'Debug', bundleId: 'com.rxliuli.gmail-notifier' },
      { id: UNRELATED, name: 'Debug', bundleId: 'com.unrelated.thing' },
    ]);
    const result = applyBundleIds(
      content,
      new Map([
        [APP_DEBUG, 'com.rxliuli.gmail-notifier'],
        [EXT_DEBUG, 'com.rxliuli.gmail-notifier.Extension'],
      ]),
    );
    expect(idsInFile(result)).toEqual([
      'com.rxliuli.gmail-notifier',
      'com.rxliuli.gmail-notifier.Extension',
      'com.unrelated.thing',
    ]);
  });

  it('leaves everything else in the block alone', () => {
    const content = pbxproj([
      { id: APP_DEBUG, name: 'Debug', bundleId: 'com.old' },
    ]);
    const result = applyBundleIds(content, new Map([[APP_DEBUG, 'com.new']]));
    expect(result).toContain('SWIFT_VERSION = 5.0;');
    expect(result).toContain('name = Debug;');
  });

  it('leaves a bare (no special characters) replacement id unquoted', () => {
    const content = pbxproj([
      { id: APP_DEBUG, name: 'Debug', bundleId: 'com.example.DemoApp' },
    ]);
    const result = applyBundleIds(
      content,
      new Map([[APP_DEBUG, 'com.example.demo']]),
    );
    expect(result).toContain('PRODUCT_BUNDLE_IDENTIFIER = com.example.demo;');
  });

  it('is idempotent', () => {
    const content = pbxproj([
      { id: APP_DEBUG, name: 'Debug', bundleId: 'com.example.app' },
      { id: EXT_DEBUG, name: 'Debug', bundleId: 'com.example.app.Extension' },
    ]);
    const desired = new Map([
      [APP_DEBUG, 'com.example.app'],
      [EXT_DEBUG, 'com.example.app.Extension'],
    ]);
    const once = applyBundleIds(content, desired);
    expect(once).toBe(content);
    expect(applyBundleIds(once, desired)).toBe(once);
  });

  it('is a no-op when nothing was resolved', () => {
    const content = pbxproj([
      { id: APP_DEBUG, name: 'Debug', bundleId: 'com.old' },
    ]);
    expect(applyBundleIds(content, new Map())).toBe(content);
  });

  it("rewrites a block whose comment is Xcode 27's sentence style", () => {
    const content = pbxproj([
      {
        id: APP_DEBUG,
        name: 'Debug',
        bundleId: 'com.rxliuli.Inbox-Notifier-for-Gmail',
        comment:
          'Debug configuration for PBXNativeTarget "Inbox Notifier for Gmail"',
      },
      {
        id: EXT_DEBUG,
        name: 'Debug',
        bundleId: 'com.rxliuli.gmail-notifier',
        comment:
          'Debug configuration for PBXNativeTarget "Inbox Notifier for Gmail Extension"',
      },
    ]);
    const result = applyBundleIds(
      content,
      new Map([
        [APP_DEBUG, 'com.rxliuli.gmail-notifier'],
        [EXT_DEBUG, 'com.rxliuli.gmail-notifier.Extension'],
      ]),
    );
    expect(idsInFile(result)).toEqual([
      'com.rxliuli.gmail-notifier',
      'com.rxliuli.gmail-notifier.Extension',
    ]);
  });

  it('rewrites a block whose id has no comment at all', () => {
    const content = [
      '/* Begin XCBuildConfiguration section */',
      `\t\t${APP_DEBUG} = {`,
      '\t\t\t' + 'isa = XCBuildConfiguration;',
      `\t\t\tbuildSettings = {`,
      `\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.old;`,
      `\t\t\t};`,
      `\t\t\tname = Debug;`,
      `\t\t};`,
      '/* End XCBuildConfiguration section */',
    ].join('\n');
    const result = applyBundleIds(content, new Map([[APP_DEBUG, 'com.new']]));
    expect(idsInFile(result)).toEqual(['com.new']);
  });
});
