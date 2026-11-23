import fs from 'node:fs/promises';
import path from 'node:path';

import {
  convertToXcodeProject,
  type ConvertToXcodeProjectOptions,
  type SafariProjectType,
} from './xcode';

export type { ConvertToXcodeProjectOptions, SafariProjectType };
export { convertToXcodeProject };

export interface SafariOptions {
  /** App category, e.g. 'public.app-category.productivity'. */
  appCategory: string;
  /** Bundle identifier, e.g. 'com.example.your-extension'. */
  bundleIdentifier: string;
  /** Apple Developer Team ID. */
  developmentTeam?: string;
  /** Target Apple platforms. Defaults to 'both' (macOS and iOS). */
  projectType?: SafariProjectType;
  /** Open the Xcode project after creation. Defaults to false. */
  openProject?: boolean;
}

/**
 * Minimal structural subset of WXT's `Wxt` instance so this internal package
 * has zero runtime or build-time dependency on `wxt`.
 */
export interface SafariModuleWxt {
  config: {
    browser: string;
    command: 'build' | 'serve';
    root: string;
    outBaseDir: string;
    outDir: string;
    manifestVersion: number;
    manifest: {
      name?: string;
      version?: string;
    };
  };
  logger: {
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
    success: (...args: any[]) => void;
  };
  hooks: {
    hook: (
      name: 'build:done',
      fn: (wxt: SafariModuleWxt) => Promise<void> | void,
    ) => void;
  };
}

async function readPackageJson(
  root: string,
): Promise<{ name?: string; version?: string } | undefined> {
  return fs
    .readFile(path.join(root, 'package.json'), 'utf-8')
    .then((data) => JSON.parse(data) as { name?: string; version?: string })
    .catch(() => undefined);
}

export async function resolveProjectName(
  wxt: Pick<SafariModuleWxt, 'config'>,
): Promise<string | undefined> {
  return (
    wxt.config.manifest.name ?? (await readPackageJson(wxt.config.root))?.name
  );
}

export async function resolveProjectVersion(
  wxt: Pick<SafariModuleWxt, 'config'>,
): Promise<string | undefined> {
  return (
    wxt.config.manifest.version ??
    (await readPackageJson(wxt.config.root))?.version
  );
}

const safariModule = {
  name: 'wxt:built-in:safari',
  configKey: 'safari',
  async setup(wxt: SafariModuleWxt, options?: SafariOptions) {
    if (wxt.config.browser !== 'safari') return;
    if (wxt.config.command !== 'build') return;
    if (!options) return;

    const { appCategory, bundleIdentifier, developmentTeam } = options;
    if (!appCategory || !bundleIdentifier) {
      wxt.logger.warn(
        'Safari module is not configured properly. Please provide appCategory and bundleIdentifier under the "safari" key in wxt.config.ts.',
      );
      return;
    }

    const projectType = options.projectType ?? 'both';
    const openProject = options.openProject ?? false;

    wxt.hooks.hook('build:done', async (wxt) => {
      if (process.platform !== 'darwin') {
        throw new Error('Safari Xcode conversion is only supported on macOS.');
      }

      const projectName = await resolveProjectName(wxt);
      if (!projectName) {
        wxt.logger.warn(
          'Safari module: cannot name the Xcode project — set `manifest.name` in wxt.config.ts, or "name" in package.json.',
        );
        return;
      }

      const version = await resolveProjectVersion(wxt);
      if (!version) {
        throw new Error(
          'Safari module: missing extension version — set `manifest.version` in wxt.config.ts, or "version" in package.json.',
        );
      }

      wxt.logger.info('Converting Safari extension to Xcode project...');
      await convertToXcodeProject({
        projectName,
        version,
        appCategory,
        bundleIdentifier,
        developmentTeam,
        projectType,
        openProject,
        rootPath: wxt.config.root,
        manifestVersion: wxt.config.manifestVersion,
        outBaseDir: wxt.config.outBaseDir,
        extensionDir: wxt.config.outDir,
        log: (msg) => wxt.logger.warn(`Safari module: ${msg}`),
      });
      wxt.logger.success('Xcode project created successfully!');
    });
  },
};

export default safariModule;
