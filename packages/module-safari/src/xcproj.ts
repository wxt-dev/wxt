/**
 * Xcode 27.2's JSON project format (`project.xcproj`), which new projects —
 * including the ones `safari-web-extension-converter` generates — use in place
 * of the OpenStep `project.pbxproj`.
 *
 * Unlike a pbxproj this is plain data: targets carry their own `build-settings`
 * and a readable `product-type`, with no object ids to chase and no comments to
 * preserve. So it is parsed, edited as an object and written back, rather than
 * patched by text substitution.
 */

type BuildSettingValue = string | string[];
type BuildSettings = Record<string, BuildSettingValue>;

interface XcprojTarget {
  name?: string;
  'product-type'?: string;
  'build-settings'?: BuildSettings;
  [key: string]: unknown;
}

export interface XcprojProject {
  targets?: XcprojTarget[];
  'build-settings'?: BuildSettings;
  [key: string]: unknown;
}

export interface XcprojSettings {
  appCategory: string;
  bundleIdentifier: string;
  developmentTeam?: string;
  /** The extension's version, e.g. "1.2.3". */
  version: string;
  /** The build number derived from it. */
  projectVersion: number;
}

const PRODUCT_TYPE_APPLICATION = 'application';
const PRODUCT_TYPE_APP_EXTENSION = 'app-extension';
/** What the converter itself uses, and what it writes into ViewController.swift. */
const EXTENSION_SUFFIX = '.Extension';

/**
 * Xcode writes the file with trailing commas, which JSON.parse rejects. Drop
 * the ones that sit before a closing bracket, leaving string contents alone.
 */
export function parseXcproj(text: string): XcprojProject {
  let out = '';
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    if (inString) {
      out += char;
      if (char === '\\') out += text[++i] ?? '';
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      out += char;
      continue;
    }
    if (char === ',') {
      let next = i + 1;
      while (next < text.length && /\s/.test(text[next]!)) next++;
      if (text[next] === '}' || text[next] === ']') continue;
    }
    out += char;
  }
  return JSON.parse(out) as XcprojProject;
}

export function serializeXcproj(project: XcprojProject): string {
  return JSON.stringify(project, null, 2) + '\n';
}

/**
 * A setting can be given once, or once per configuration as
 * `NAME[config=Release]`. Overwrite whichever forms are there so a
 * per-configuration value can't shadow the new one; add the plain form when the
 * setting is absent.
 */
function setSetting(
  settings: BuildSettings,
  name: string,
  value: string,
): void {
  const existing = Object.keys(settings).filter(
    (key) => key === name || key.startsWith(`${name}[`),
  );
  if (existing.length === 0) settings[name] = value;
  else for (const key of existing) settings[key] = value;
}

/**
 * Xcode keeps build settings in key order; keep added ones where it would put
 * them.
 */
function sorted(settings: BuildSettings): BuildSettings {
  return Object.fromEntries(
    Object.entries(settings).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
}

/**
 * Apply to a parsed project what `updateProjectConfig` does to a pbxproj:
 * version and build number on every app and extension target, the store
 * metadata on the apps, the app's bundle id with its extension's derived from
 * it, and the category and team project-wide.
 */
export function patchXcproj(
  project: XcprojProject,
  settings: XcprojSettings,
): XcprojProject {
  for (const target of project.targets ?? []) {
    const isApp = target['product-type'] === PRODUCT_TYPE_APPLICATION;
    const isExtension = target['product-type'] === PRODUCT_TYPE_APP_EXTENSION;
    if (!isApp && !isExtension) continue;

    const build = { ...target['build-settings'] };
    setSetting(
      build,
      'PRODUCT_BUNDLE_IDENTIFIER',
      isApp
        ? settings.bundleIdentifier
        : settings.bundleIdentifier + EXTENSION_SUFFIX,
    );
    setSetting(build, 'MARKETING_VERSION', settings.version);
    setSetting(
      build,
      'CURRENT_PROJECT_VERSION',
      String(settings.projectVersion),
    );
    if (isApp) {
      setSetting(
        build,
        'INFOPLIST_KEY_LSApplicationCategoryType',
        settings.appCategory,
      );
      setSetting(build, 'INFOPLIST_KEY_ITSAppUsesNonExemptEncryption', 'NO');
    }
    target['build-settings'] = sorted(build);
  }

  const build = { ...project['build-settings'] };
  setSetting(
    build,
    'INFOPLIST_KEY_LSApplicationCategoryType',
    settings.appCategory,
  );
  if (settings.developmentTeam)
    setSetting(build, 'DEVELOPMENT_TEAM', settings.developmentTeam);
  project['build-settings'] = sorted(build);

  return project;
}
