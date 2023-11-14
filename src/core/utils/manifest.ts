import type { Manifest } from 'webextension-polyfill';
import {
  Entrypoint,
  BackgroundEntrypoint,
  BuildOutput,
  ContentScriptEntrypoint,
  InternalConfig,
  OptionsEntrypoint,
  PopupEntrypoint,
} from '~/types';
import fs from 'fs-extra';
import { resolve } from 'path';
import {
  getEntrypointBundlePath,
  resolvePerBrowserOption,
} from './entrypoints';
import { ContentSecurityPolicy } from './content-security-policy';
import {
  hashContentScriptOptions,
  mapWxtOptionsToContentScript,
} from './content-scripts';
import { getPackageJson } from './package';
import { normalizePath } from './paths';
import { writeFileIfDifferent } from './fs';
import { produce } from 'immer';
import * as vite from 'vite';

/**
 * Writes the manifest to the output directory and the build output.
 */
export async function writeManifest(
  manifest: Manifest.WebExtensionManifest,
  output: BuildOutput,
  config: InternalConfig,
): Promise<void> {
  const str =
    config.mode === 'production'
      ? JSON.stringify(manifest)
      : JSON.stringify(manifest, null, 2);

  await fs.ensureDir(config.outDir);
  await writeFileIfDifferent(resolve(config.outDir, 'manifest.json'), str);

  output.publicAssets.unshift({
    type: 'asset',
    fileName: 'manifest.json',
    name: 'manifest',
    needsCodeReference: false,
    source: str,
  });
}

/**
 * Generates the manifest based on the config and entrypoints.
 */
export async function generateMainfest(
  entrypoints: Entrypoint[],
  buildOutput: Omit<BuildOutput, 'manifest'>,
  config: InternalConfig,
): Promise<Manifest.WebExtensionManifest> {
  const pkg = await getPackageJson(config);

  const versionName = config.manifest.version_name ?? pkg?.version;
  const version = config.manifest.version ?? simplifyVersion(pkg?.version);

  const baseManifest: Manifest.WebExtensionManifest = {
    manifest_version: config.manifestVersion,
    name: pkg?.name,
    description: pkg?.description,
    version,
    version_name:
      // Firefox doesn't support version_name
      config.browser === 'firefox' || versionName === version
        ? undefined
        : versionName,
    short_name: pkg?.shortName,
    icons: discoverIcons(buildOutput),
  };
  const userManifest = config.manifest;

  const manifest = vite.mergeConfig(
    baseManifest,
    userManifest,
  ) as Manifest.WebExtensionManifest;

  addEntrypoints(manifest, entrypoints, buildOutput, config);

  if (config.command === 'serve') addDevModeCsp(manifest, config);
  if (config.command === 'serve') addDevModePermissions(manifest, config);

  const finalManifest = produce(manifest, config.transformManifest);

  if (finalManifest.name == null)
    throw Error(
      "Manifest 'name' is missing. Either:\n1. Set the name in your <rootDir>/package.json\n2. Set a name via the manifest option in your wxt.config.ts",
    );
  if (finalManifest.version == null) {
    throw Error(
      "Manifest 'version' is missing. Either:\n1. Add a version in your <rootDir>/package.json\n2. Pass the version via the manifest option in your wxt.config.ts",
    );
  }

  return finalManifest;
}

/**
 * Removes suffixes from the version, like X.Y.Z-alpha1 (which brosers don't allow), so it's a
 * simple version number, like X or X.Y or X.Y.Z, which browsers allow.
 */
function simplifyVersion(versionName: string): string {
  // Regex adapted from here: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/version#version_format
  const version = /^((0|[1-9][0-9]{0,8})([.](0|[1-9][0-9]{0,8})){0,3}).*$/.exec(
    versionName,
  )?.[1];

  if (version == null)
    throw Error(
      `Cannot simplify package.json version "${versionName}" to a valid extension version, "X.Y.Z"`,
    );

  return version;
}

function addEntrypoints(
  manifest: Manifest.WebExtensionManifest,
  entrypoints: Entrypoint[],
  buildOutput: Omit<BuildOutput, 'manifest'>,
  config: InternalConfig,
): void {
  const entriesByType = entrypoints.reduce<
    Partial<Record<Entrypoint['type'], Entrypoint[]>>
  >((map, entrypoint) => {
    map[entrypoint.type] ??= [];
    map[entrypoint.type]?.push(entrypoint);
    return map;
  }, {});

  const background = entriesByType['background']?.[0] as
    | BackgroundEntrypoint
    | undefined;
  const bookmarks = entriesByType['bookmarks']?.[0];
  const contentScripts = entriesByType['content-script'] as
    | ContentScriptEntrypoint[]
    | undefined;
  const devtools = entriesByType['devtools']?.[0];
  const history = entriesByType['history']?.[0];
  const newtab = entriesByType['newtab']?.[0];
  const options = entriesByType['options']?.[0] as
    | OptionsEntrypoint
    | undefined;
  const popup = entriesByType['popup']?.[0] as PopupEntrypoint | undefined;
  const sandboxes = entriesByType['sandbox'];
  const sidepanels = entriesByType['sidepanel'];

  if (background) {
    const script = getEntrypointBundlePath(background, config.outDir, '.js');
    if (config.browser === 'firefox' && config.manifestVersion === 3) {
      manifest.background = {
        type: background.options.type,
        scripts: [script],
      };
    } else if (config.manifestVersion === 3) {
      manifest.background = {
        type: background.options.type,
        service_worker: script,
      };
    } else {
      manifest.background = {
        persistent: background.options.persistent,
        scripts: [script],
      };
    }
  }

  if (bookmarks) {
    if (config.browser === 'firefox') {
      config.logger.warn(
        'Bookmarks are not supported by Firefox. chrome_url_overrides.bookmarks was not added to the manifest',
      );
    } else {
      manifest.chrome_url_overrides ??= {};
      // @ts-expect-error: bookmarks is untyped in webextension-polyfill, but supported by chrome
      manifest.chrome_url_overrides.bookmarks = getEntrypointBundlePath(
        bookmarks,
        config.outDir,
        '.html',
      );
    }
  }

  if (history) {
    if (config.browser === 'firefox') {
      config.logger.warn(
        'Bookmarks are not supported by Firefox. chrome_url_overrides.history was not added to the manifest',
      );
    } else {
      manifest.chrome_url_overrides ??= {};
      // @ts-expect-error: history is untyped in webextension-polyfill, but supported by chrome
      manifest.chrome_url_overrides.history = getEntrypointBundlePath(
        history,
        config.outDir,
        '.html',
      );
    }
  }

  if (newtab) {
    manifest.chrome_url_overrides ??= {};
    manifest.chrome_url_overrides.newtab = getEntrypointBundlePath(
      newtab,
      config.outDir,
      '.html',
    );
  }

  if (popup) {
    const default_popup = getEntrypointBundlePath(
      popup,
      config.outDir,
      '.html',
    );
    const options: Manifest.ActionManifest = {};
    if (popup.options.defaultIcon)
      options.default_icon = popup.options.defaultIcon;
    if (popup.options.defaultTitle)
      options.default_title = popup.options.defaultTitle;
    if (popup.options.browserStyle)
      options.browser_style = popup.options.browserStyle;
    if (manifest.manifest_version === 3) {
      manifest.action = {
        ...(manifest.action ?? {}),
        ...options,
        default_popup,
      };
    } else {
      const key = popup.options.mv2Key ?? 'browser_action';
      manifest[key] = {
        ...(manifest[key] ?? {}),
        ...options,
        default_popup,
      };
    }
  }

  if (devtools) {
    manifest.devtools_page = getEntrypointBundlePath(
      devtools,
      config.outDir,
      '.html',
    );
  }

  if (options) {
    const page = getEntrypointBundlePath(options, config.outDir, '.html');
    manifest.options_ui = {
      open_in_tab: options.options.openInTab,
      browser_style:
        config.browser === 'firefox' ? options.options.browserStyle : undefined,
      chrome_style:
        config.browser !== 'firefox' ? options.options.chromeStyle : undefined,
      page,
    };
  }

  if (sandboxes?.length) {
    if (config.browser === 'firefox') {
      config.logger.warn(
        'Sandboxed pages not supported by Firefox. sandbox.pages was not added to the manifest',
      );
    } else {
      // @ts-expect-error: sandbox not typed
      manifest.sandbox = {
        pages: sandboxes.map((entry) =>
          getEntrypointBundlePath(entry, config.outDir, '.html'),
        ),
      };
    }
  }

  if (sidepanels?.length) {
    const defaultSidepanel =
      sidepanels.find((entry) => entry.name === 'sidepanel') ?? sidepanels[0];
    const page = getEntrypointBundlePath(
      defaultSidepanel,
      config.outDir,
      '.html',
    );

    if (config.browser === 'firefox') {
      manifest.sidebar_action = {
        // TODO: Add options to side panel
        // ...defaultSidepanel.options,
        default_panel: page,
      };
    } else if (config.manifestVersion === 3) {
      // @ts-expect-error: Untyped
      manifest.side_panel = {
        default_path: page,
      };
    } else {
      config.logger.warn(
        'Side panel not supported by Chromium using MV2. side_panel.default_path was not added to the manifest',
      );
    }
  }

  if (contentScripts?.length) {
    const cssMap = getContentScriptsCssMap(buildOutput, contentScripts);

    // Don't add content scripts to the manifest in dev mode for MV3 - they're managed and reloaded
    // at runtime
    if (config.command === 'serve' && config.manifestVersion === 3) {
      const hostPermissions = new Set<string>(manifest.host_permissions ?? []);
      contentScripts.forEach((script) => {
        const matches = resolvePerBrowserOption(
          script.options.matches,
          config.browser,
        );
        matches.forEach((matchPattern) => {
          hostPermissions.add(matchPattern);
        });
      });
      hostPermissions.forEach((permission) =>
        addHostPermission(manifest, permission),
      );
    } else {
      const hashToEntrypointsMap = contentScripts.reduce((map, script) => {
        const hash = hashContentScriptOptions(script.options, config);
        if (map.has(hash)) map.get(hash)?.push(script);
        else map.set(hash, [script]);
        return map;
      }, new Map<string, ContentScriptEntrypoint[]>());

      const newContentScripts = Array.from(hashToEntrypointsMap.entries()).map(
        ([, scripts]) => ({
          ...mapWxtOptionsToContentScript(scripts[0].options, config),
          css: getContentScriptCssFiles(scripts, cssMap),
          js: scripts.map((entry) =>
            getEntrypointBundlePath(entry, config.outDir, '.js'),
          ),
        }),
      );
      if (newContentScripts.length >= 0) {
        manifest.content_scripts ??= [];
        manifest.content_scripts.push(...newContentScripts);
      }
    }

    const contentScriptCssResources = getContentScriptCssWebAccessibleResources(
      config,
      contentScripts,
      cssMap,
    );
    if (contentScriptCssResources.length > 0) {
      manifest.web_accessible_resources ??= [];
      manifest.web_accessible_resources.push(...contentScriptCssResources);
    }
  }
}

function discoverIcons(
  buildOutput: Omit<BuildOutput, 'manifest'>,
): Manifest.WebExtensionManifest['icons'] {
  const icons: [string, string][] = [];
  // prettier-ignore
  // #region snippet
  const iconRegex = [
    /^icon-([0-9]+)\.png$/,                 // icon-16.png
    /^icon-([0-9]+)x[0-9]+\.png$/,          // icon-16x16.png
    /^icon@([0-9]+)w\.png$/,                // icon@16w.png
    /^icon@([0-9]+)h\.png$/,                // icon@16h.png
    /^icon@([0-9]+)\.png$/,                 // icon@16.png
    /^icons?[\/\\]([0-9]+)\.png$/,          // icon/16.png | icons/16.png
    /^icons?[\/\\]([0-9]+)x[0-9]+\.png$/,   // icon/16x16.png | icons/16x16.png
  ];
  // #endregion snippet

  buildOutput.publicAssets.forEach((asset) => {
    let size: string | undefined;
    for (const regex of iconRegex) {
      const match = asset.fileName.match(regex);
      if (match?.[1] != null) {
        size = match[1];
        break;
      }
    }
    if (size == null) return;

    icons.push([size, normalizePath(asset.fileName)]);
  });

  return icons.length > 0 ? Object.fromEntries(icons) : undefined;
}

function addDevModeCsp(
  manifest: Manifest.WebExtensionManifest,
  config: InternalConfig,
): void {
  const permission = `http://${config.server?.hostname ?? ''}/*`;
  const allowedCsp = config.server?.origin ?? 'http://localhost:*';

  if (manifest.manifest_version === 3) {
    addHostPermission(manifest, permission);
  } else {
    addPermission(manifest, permission);
  }

  const csp = new ContentSecurityPolicy(
    manifest.manifest_version === 3
      ? // @ts-expect-error: extension_pages is not typed
        manifest.content_security_policy?.extension_pages ??
        "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';" // default CSP for MV3
      : manifest.content_security_policy ??
        "script-src 'self'; object-src 'self';", // default CSP for MV2
  );

  if (config.server) csp.add('script-src', allowedCsp);

  if (manifest.manifest_version === 3) {
    manifest.content_security_policy ??= {};
    // @ts-expect-error: extension_pages is not typed
    manifest.content_security_policy.extension_pages = csp.toString();
  } else {
    manifest.content_security_policy = csp.toString();
  }
}

function addDevModePermissions(
  manifest: Manifest.WebExtensionManifest,
  config: InternalConfig,
) {
  // For reloading the page
  addPermission(manifest, 'tabs');

  // For registering content scripts
  if (config.manifestVersion === 3) addPermission(manifest, 'scripting');
}

/**
 * Returns the bundle paths to CSS files associated with a list of content scripts, or undefined if
 * there is no associated CSS.
 */
export function getContentScriptCssFiles(
  contentScripts: ContentScriptEntrypoint[],
  contentScriptCssMap: Record<string, string | undefined>,
): string[] | undefined {
  const css: string[] = [];

  contentScripts.forEach((script) => {
    if (
      script.options.cssInjectionMode === 'manual' ||
      script.options.cssInjectionMode === 'ui'
    )
      return;

    const cssFile = contentScriptCssMap[script.name];
    if (cssFile == null) return;

    if (cssFile) css.push(cssFile);
  });

  if (css.length > 0) return css;
  return undefined;
}

/**
 * Content scripts configured with `cssInjectionMode: "ui"` need to add their CSS files to web
 * accessible resources so they can be fetched as text and added to shadow roots that the UI is
 * added to.
 */
export function getContentScriptCssWebAccessibleResources(
  config: InternalConfig,
  contentScripts: ContentScriptEntrypoint[],
  contentScriptCssMap: Record<string, string | undefined>,
): any[] {
  const resources: any[] = [];

  contentScripts.forEach((script) => {
    if (script.options.cssInjectionMode !== 'ui') return;

    const cssFile = contentScriptCssMap[script.name];
    if (cssFile == null) return;

    if (config.manifestVersion === 2) {
      resources.push(cssFile);
    } else {
      resources.push({
        resources: [cssFile],
        matches: script.options.matches,
      });
    }
  });

  return resources;
}

/**
 * Based on the build output, return a Record of each content script's name to it CSS file if the
 * script includes one.
 */
export function getContentScriptsCssMap(
  buildOutput: Omit<BuildOutput, 'manifest'>,
  scripts: ContentScriptEntrypoint[],
) {
  const map: Record<string, string | undefined> = {};
  const allChunks = buildOutput.steps.flatMap((step) => step.chunks);
  scripts.forEach((script) => {
    const relatedCss = allChunks.find(
      (chunk) => chunk.fileName === `content-scripts/${script.name}.css`,
    );
    if (relatedCss != null) map[script.name] = relatedCss.fileName;
  });
  return map;
}

function addPermission(
  manifest: Manifest.WebExtensionManifest,
  permission: string,
): void {
  manifest.permissions ??= [];
  if (manifest.permissions.includes(permission)) return;
  manifest.permissions.push(permission);
}

function addHostPermission(
  manifest: Manifest.WebExtensionManifest,
  hostPermission: string,
): void {
  manifest.host_permissions ??= [];
  if (manifest.host_permissions.includes(hostPermission)) return;
  manifest.host_permissions.push(hostPermission);
}
