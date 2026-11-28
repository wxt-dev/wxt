import fs from 'node:fs/promises';
import path from 'node:path';

import { capture, run } from './exec';
import { writeSetupPage } from './setup-page';
import { parseXcproj, patchXcproj, serializeXcproj } from './xcproj';

export type SafariProjectType = 'macos' | 'ios' | 'both';

export interface ConvertToXcodeProjectOptions {
  projectName: string;
  version: string;
  appCategory: string;
  bundleIdentifier: string;
  developmentTeam?: string;
  projectType: SafariProjectType;
  openProject: boolean;
  rootPath: string;
  manifestVersion: number;
  /**
   * Output base directory (e.g. `.output`), relative to `rootPath` or absolute.
   * Defaults to `.output`.
   */
  outBaseDir?: string;
  /**
   * Built Safari extension directory, relative to `rootPath` or absolute.
   * Defaults to `.output/safari-mv${manifestVersion}`.
   */
  extensionDir?: string;
}

/**
 * Runs `xcrun safari-web-extension-converter`, then patches the generated
 * project (version, category, team, bundle ids), and replaces the placeholder
 * host-app page with a real setup guide.
 */
export async function convertToXcodeProject(
  opts: ConvertToXcodeProjectOptions & { log?: (msg: string) => void },
): Promise<void> {
  const outBaseDir = path.resolve(opts.rootPath, opts.outBaseDir ?? '.output');
  const extensionDir = path.resolve(
    opts.rootPath,
    opts.extensionDir ??
      path.join(outBaseDir, `safari-mv${opts.manifestVersion}`),
  );

  const flags = ['--force', '--no-prompt'];
  if (opts.projectType === 'ios') flags.push('--ios-only');
  if (opts.projectType === 'macos') flags.push('--macos-only');
  if (!opts.openProject) flags.push('--no-open');

  await run(
    'xcrun',
    [
      'safari-web-extension-converter',
      '--bundle-identifier',
      opts.bundleIdentifier,
      '--project-location',
      outBaseDir,
      ...flags,
      extensionDir,
    ],
    { cwd: opts.rootPath },
  );

  const postOpts: PostBuildOptions = { ...opts, outBaseDir };
  await updateProjectConfig(postOpts);
  await updateInfoPlist(postOpts);

  // Cosmetic: a failure here must not fail an otherwise good build.
  const wrote = await writeSetupPage({
    projectName: opts.projectName,
    projectRoot: projectDir(postOpts),
  });
  if (!wrote)
    opts.log?.(
      "couldn't find the host app's Resources directory — left the generated setup page in place",
    );
}

interface PostBuildOptions {
  projectName: string;
  version: string;
  appCategory: string;
  bundleIdentifier: string;
  developmentTeam?: string;
  rootPath: string;
  outBaseDir: string;
}

/**
 * The converter names the project directory after the manifest's `name`
 * verbatim — spaces, hyphens and all — and projectName is resolved from that
 * same manifest, so this is always where the project landed.
 */
function projectDir(options: PostBuildOptions): string {
  return path.join(options.outBaseDir, options.projectName);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Xcode 27.2 and later generate new projects in the JSON `project.xcproj`
 * format; earlier versions write the OpenStep `project.pbxproj`. Which one the
 * converter produced depends only on the Xcode that ran it, so look rather than
 * guess from a version number.
 */
async function updateProjectConfig(options: PostBuildOptions): Promise<void> {
  const xcodeprojPath = path.join(
    projectDir(options),
    `${options.projectName}.xcodeproj`,
  );
  const projectVersion = parseProjectVersion(options.version);

  const xcprojPath = path.join(xcodeprojPath, 'project.xcproj');
  if (await exists(xcprojPath)) {
    const project = patchXcproj(
      parseXcproj(await fs.readFile(xcprojPath, 'utf-8')),
      {
        appCategory: options.appCategory,
        bundleIdentifier: options.bundleIdentifier,
        developmentTeam: options.developmentTeam,
        version: options.version,
        projectVersion,
      },
    );
    await fs.writeFile(xcprojPath, serializeXcproj(project));
    return;
  }

  const projectConfigPath = path.join(xcodeprojPath, 'project.pbxproj');
  const content = await fs.readFile(projectConfigPath, 'utf-8');
  const desired = resolveBundleIds(
    await readPbxObjects(projectConfigPath),
    options.bundleIdentifier,
  );
  const newContent = applyBundleIds(content, desired)
    .replaceAll(
      'MARKETING_VERSION = 1.0;',
      `MARKETING_VERSION = ${options.version};`,
    )
    .replace(
      new RegExp(
        `INFOPLIST_KEY_CFBundleDisplayName = ("?${escapeRegExp(options.projectName)}"?);`,
        'g',
      ),
      (_match, displayName: string) =>
        `INFOPLIST_KEY_CFBundleDisplayName = ${displayName};\n\t\t\t\tINFOPLIST_KEY_ITSAppUsesNonExemptEncryption = NO;\n\t\t\t\tINFOPLIST_KEY_LSApplicationCategoryType = "${options.appCategory}";`,
    )
    .replace(
      /GCC_WARN_UNUSED_VARIABLE = YES;/g,
      `GCC_WARN_UNUSED_VARIABLE = YES;\n\t\t\t\tINFOPLIST_KEY_LSApplicationCategoryType = "${options.appCategory}";`,
    )
    .replaceAll(
      'COPY_PHASE_STRIP = NO;',
      options.developmentTeam
        ? `COPY_PHASE_STRIP = NO;\n\t\t\t\tDEVELOPMENT_TEAM = ${options.developmentTeam};`
        : 'COPY_PHASE_STRIP = NO;',
    )
    .replace(
      /CURRENT_PROJECT_VERSION = \d+;/g,
      `CURRENT_PROJECT_VERSION = ${projectVersion};`,
    );
  await fs.writeFile(projectConfigPath, newContent);
}

async function exists(file: string): Promise<boolean> {
  return fs.access(file).then(
    () => true,
    () => false,
  );
}

async function updateInfoPlist(options: PostBuildOptions): Promise<void> {
  const projectPath = projectDir(options);
  const files = await findInfoPlistFiles(projectPath);
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    if (content.includes('<key>CFBundleVersion</key>')) continue;
    await fs.writeFile(
      file,
      content.replaceAll(
        '</dict>\n</plist>',
        '\t<key>CFBundleVersion</key>\n\t<string>$(CURRENT_PROJECT_VERSION)</string>\n</dict>\n</plist>',
      ),
    );
  }
}

async function findInfoPlistFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...(await findInfoPlistFiles(full)));
    else if (entry.isFile() && entry.name === 'Info.plist') results.push(full);
  }
  return results;
}

export function parseProjectVersion(version: string): number {
  const cleaned = version.trim().replace(/^v/i, '').split(/[-+]/, 1)[0] ?? '';
  const parts = cleaned.split('.');
  if (
    parts.length === 0 ||
    parts.length > 3 ||
    parts.some((p) => !/^\d+$/.test(p))
  ) {
    throw new Error(
      `Invalid version "${version}": expected 1 to 3 non-negative integer parts (e.g. "1.2.3").`,
    );
  }
  const [major = 0, minor = 0, patch = 0] = parts.map(Number);
  if (
    !Number.isSafeInteger(major) ||
    !Number.isSafeInteger(minor) ||
    !Number.isSafeInteger(patch)
  ) {
    throw new Error(
      `Invalid version "${version}": version numbers are out of range.`,
    );
  }
  return major * 10000 + minor * 100 + patch;
}

function quote(value: string): string {
  return /^[A-Za-z0-9._]+$/.test(value) ? value : `"${value}"`;
}

const PRODUCT_TYPE_APPLICATION = 'com.apple.product-type.application';
const PRODUCT_TYPE_APP_EXTENSION = 'com.apple.product-type.app-extension';
/** What the converter itself uses, and what it writes into ViewController.swift. */
const EXTENSION_SUFFIX = '.Extension';

/** One entry of a pbxproj's flat `objects` map, as plutil hands it back. */
interface PbxObject {
  isa?: string;
  productType?: string;
  buildConfigurationList?: string;
  buildConfigurations?: string[];
}

const BUILD_CONFIG_BLOCK =
  /([0-9A-Fa-f]{24})(?: \/\*[^*]*\*\/)? = \{\s*isa = XCBuildConfiguration;[\s\S]*?\n\t\t\};/g;
const SINGLE_BUNDLE_ID = /PRODUCT_BUNDLE_IDENTIFIER = ("[^"]*"|[^;]+);/;

/**
 * A pbxproj is an OpenStep property list, so Apple's own parser reads it
 * natively. Going through plutil means the project's structure is never
 * something we infer — if the format shifts, plutil shifts with it.
 */
export async function readPbxObjects(
  pbxprojPath: string,
): Promise<Record<string, PbxObject>> {
  const json = await capture('plutil', [
    '-convert',
    'json',
    '-o',
    '-',
    pbxprojPath,
  ]);
  return (
    (JSON.parse(json) as { objects?: Record<string, PbxObject> }).objects ?? {}
  );
}

export function resolveBundleIds(
  objects: Record<string, PbxObject>,
  bundleIdentifier: string,
): Map<string, string> {
  const desired = new Map<string, string>();
  for (const target of Object.values(objects)) {
    if (target.isa !== 'PBXNativeTarget' || !target.buildConfigurationList)
      continue;

    const id =
      target.productType === PRODUCT_TYPE_APPLICATION
        ? bundleIdentifier
        : target.productType === PRODUCT_TYPE_APP_EXTENSION
          ? bundleIdentifier + EXTENSION_SUFFIX
          : undefined;
    if (!id) continue;

    const list = objects[target.buildConfigurationList];
    if (list?.isa !== 'XCConfigurationList') continue;
    for (const configId of list.buildConfigurations ?? [])
      desired.set(configId, id);
  }
  return desired;
}

export function applyBundleIds(
  content: string,
  desired: Map<string, string>,
): string {
  if (desired.size === 0) return content;

  return content.replace(BUILD_CONFIG_BLOCK, (block, configId: string) => {
    const want = desired.get(configId);
    if (!want) return block;
    return block.replace(
      SINGLE_BUNDLE_ID,
      `PRODUCT_BUNDLE_IDENTIFIER = ${quote(want)};`,
    );
  });
}
