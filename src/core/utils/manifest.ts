import { Entrypoint } from '../..';
import { Manifest } from 'webextension-polyfill';
import {
  BackgroundEntrypoint,
  BuildOutput,
  ContentScriptEntrypoint,
  InternalConfig,
  OptionsEntrypoint,
  PopupEntrypoint,
} from '../types';
import fs from 'fs-extra';
import { resolve } from 'path';
import { getEntrypointBundlePath } from './entrypoints';
import { ContentSecurityPolicy } from './ContentSecurityPolicy';
import {
  hashContentScriptOptions,
  mapWxtOptionsToContentScript,
} from './content-scripts';
import { getPackageJson } from './package';

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
  await fs.writeFile(resolve(config.outDir, 'manifest.json'), str, 'utf-8');

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

  const manifest: Manifest.WebExtensionManifest = Object.assign(
    {
      manifest_version: config.manifestVersion,
      name: pkg?.name,
      description: pkg?.description,
      version: pkg?.version && simplifyVersion(pkg.version),
      // Only add the version name to chromium and if the user hasn't specified a custom version.
      version_name:
        config.browser !== 'firefox' && !config.manifest.version
          ? pkg?.version
          : undefined,
      short_name: pkg?.shortName,
      icons: discoverIcons(buildOutput),
    },
    config.manifest,
  );

  addEntrypoints(manifest, entrypoints, buildOutput, config);

  if (config.command === 'serve') addDevModeCsp(manifest, config);
  if (config.command === 'serve') addDevModePermissions(manifest, config);

  // TODO: transform manifest here.

  if (manifest.name == null)
    throw Error(
      "Manifest 'name' is missing. Either:\n1. Set the name in your <rootDir>/package.json\n2. Set a name via the manifest option in your wxt.config.ts",
    );
  if (manifest.version == null) {
    throw Error(
      "Manifest 'version' is missing. Either:\n1. Add a version in your <rootDir>/package.json\n2. Pass the version via the manifest option in your wxt.config.ts",
    );
  }

  return manifest;
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
    if (manifest.manifest_version === 3) {
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
    const options: Manifest.ActionManifest = {
      default_icon: popup.options.defaultIcon,
      default_title: popup.options.defaultTitle,
    };
    if (manifest.manifest_version === 3) {
      manifest.action = {
        ...options,
        default_popup,
      };
    } else {
      manifest[popup.options.mv2Key ?? 'browser_action'] = {
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
    // Don't add content scripts to the manifest in dev mode for MV3 - they're managed and reloaded
    // at runtime
    if (config.command === 'serve' && config.manifestVersion === 3) {
      const hostPermissions = new Set<string>(manifest.host_permissions ?? []);
      contentScripts.forEach((script) => {
        script.options.matches.forEach((matchPattern) => {
          hostPermissions.add(matchPattern);
        });
      });
      hostPermissions.forEach((permission) =>
        addHostPermission(manifest, permission),
      );
    } else {
      const hashToEntrypointsMap = contentScripts.reduce((map, script) => {
        const hash = hashContentScriptOptions(script.options);
        if (map.has(hash)) map.get(hash)?.push(script);
        else map.set(hash, [script]);
        return map;
      }, new Map<string, ContentScriptEntrypoint[]>());

      manifest.content_scripts = Array.from(hashToEntrypointsMap.entries()).map(
        ([, scripts]) => ({
          ...mapWxtOptionsToContentScript(scripts[0].options),
          // TOOD: Sorting css and js arrays here so we get consistent test results... but we
          // shouldn't have to. Where is the inconsistency coming from?
          css: getContentScriptCssFiles(scripts, buildOutput)?.sort(),
          js: scripts
            .map((entry) =>
              getEntrypointBundlePath(entry, config.outDir, '.js'),
            )
            .sort(),
        }),
      );
    }
  }
}

function discoverIcons(
  buildOutput: Omit<BuildOutput, 'manifest'>,
): Manifest.WebExtensionManifest['icons'] {
  const icons: [string, string][] = [];
  // #region snippet
  const iconRegex = [
    /^icon-([0-9]+)\.(png|bmp|jpeg|jpg|ico|gif)$/,
    /^icon-([0-9]+)x[0-9]+\.(png|bmp|jpeg|jpg|ico|gif)$/,
    /^icon@([0-9]+)w\.(png|bmp|jpeg|jpg|ico|gif)$/,
    /^icon@([0-9]+)h\.(png|bmp|jpeg|jpg|ico|gif)$/,
    /^icon@([0-9]+)\.(png|bmp|jpeg|jpg|ico|gif)$/,
    /^icon\/([0-9]+)\.(png|bmp|jpeg|jpg|ico|gif)$/,
    /^icon\/([0-9]+)x[0-9]+\.(png|bmp|jpeg|jpg|ico|gif)$/,
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

    icons.push([size, asset.fileName]);
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
  buildOutput: Omit<BuildOutput, 'manifest'>,
): string[] | undefined {
  const css: string[] = [];

  const allChunks = buildOutput.steps.flatMap((step) => step.chunks);

  contentScripts.forEach((script) => {
    // TODO: optimize and remove loop with a map
    const relatedCss = allChunks.find(
      (chunk) => chunk.fileName === `assets/${script.name}.css`,
    );
    if (relatedCss) css.push(relatedCss.fileName);
  });

  if (css.length > 0) return css;
  return undefined;
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
