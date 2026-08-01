import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Plugin, PluginContext, ResolvedId } from 'rolldown';

export type VendorBundledPackages = Array<string | RegExp>;

export interface VendorBundledDependenciesOptions {
  /**
   * Package names / patterns that are force-bundled (typically the same list as
   * `deps.alwaysBundle`). Under `unbundle` / `preserveModules`, Rolldown would
   * otherwise emit build-time `node_modules` paths (including bun/pnpm nests).
   */
  packages: VendorBundledPackages;
  /**
   * Directory (relative to `outDir` / package root) for vendored output.
   *
   * @default '_vendor'
   */
  vendorDir?: string;
  /**
   * Absolute package root used to build synthetic module IDs. Must match the
   * directory Rolldown uses for `preserveModulesRoot`, otherwise vendored files
   * are emitted outside `outDir`.
   *
   * @default process.cwd()
   */
  cwd?: string;
}

interface PackageMeta {
  version: string;
  /** Whether `.js` files in the package are ESM (`"type": "module"`). */
  isEsm: boolean;
}

interface ParsedNodeModulesPath {
  /** Absolute path to the package directory. */
  packageRoot: string;
  name: string;
  /** Path within the package, without a leading slash. */
  subpath: string;
}

/**
 * Resolve-time remapping for force-bundled dependencies in unbundle mode.
 *
 * Instead of emitting chunks that mirror `node_modules/.bun/...` (or pnpm)
 * layouts, matching packages are resolved to synthetic IDs under
 * `_vendor/<pkg>/...`. Rolldown's `preserveModules` then emits portable
 * relative imports to those output files — no post-hoc path rewriting.
 *
 * Runs with `resolveId.order: 'pre'` so it wins over tsdown's deps plugin,
 * which would otherwise lock in the absolute `node_modules` path.
 *
 * Because vendored IDs are keyed by package name, bundling two versions of the
 * same package would collapse them into one module. That throws instead, since
 * silently picking a version is worse than failing the build.
 */
export function vendorBundledDependencies(
  options: VendorBundledDependenciesOptions,
): Plugin {
  const vendorDir = options.vendorDir ?? '_vendor';
  const cwd = options.cwd ?? process.cwd();
  const vendorRoot = path.resolve(cwd, vendorDir);
  // `test()` advances `lastIndex` on sticky/global regexes, making repeated
  // matches against the same pattern unreliable.
  const packages = options.packages.map((pattern) =>
    typeof pattern === 'string'
      ? pattern
      : new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, '')),
  );

  const vendorToReal = new Map<string, string>();
  const realToVendor = new Map<string, string>();
  const packageRootByName = new Map<string, string>();
  const packageMetaCache = new Map<string, Promise<PackageMeta>>();

  return {
    name: 'vendor-bundled-dependencies',

    resolveId: {
      order: 'pre',
      async handler(id, importer, extraOptions) {
        if (extraOptions.isEntry) return;

        // Relative / absolute imports from an already-vendored module: keep
        // everything inside the vendor tree.
        if (importer != null && vendorToReal.has(importer)) {
          const realImporter = vendorToReal.get(importer)!;
          const resolved = await this.resolve(id, realImporter, {
            ...extraOptions,
            skipSelf: true,
          });
          if (resolved == null || resolved.external) return resolved;
          return await remapToVendor(this, resolved);
        }

        if (!isBareSpecifier(id) || !matchesPackage(id, packages)) return;

        const resolved = await this.resolve(id, importer, {
          ...extraOptions,
          skipSelf: true,
        });
        if (resolved == null || resolved.external) return resolved;
        return await remapToVendor(this, resolved);
      },
    },

    async load(id) {
      const real = vendorToReal.get(id);
      if (real == null) return;
      return await readFile(real, 'utf8');
    },
  };

  async function remapToVendor(
    ctx: PluginContext,
    resolved: ResolvedId,
  ): Promise<ResolvedId> {
    const cached = realToVendor.get(resolved.id);
    if (cached != null) {
      return { ...resolved, id: cached };
    }

    const parsed = parseNodeModulesPath(resolved.id);
    if (parsed == null) {
      // Linked or workspace packages resolve outside node_modules, so there's
      // no package name to vendor under. Leaving the path as-is reintroduces
      // build-time paths into the output, so make it visible.
      ctx.warn(
        `[vendor-bundled-dependencies] Could not vendor "${resolved.id}": not inside node_modules. The build-time path will leak into the output.`,
      );
      return resolved;
    }

    const knownRoot = packageRootByName.get(parsed.name);
    if (knownRoot != null && knownRoot !== parsed.packageRoot) {
      const [a, b] = await Promise.all([
        readPackageMeta(knownRoot),
        readPackageMeta(parsed.packageRoot),
      ]);
      throw new Error(
        `[vendor-bundled-dependencies] Cannot vendor two versions of "${parsed.name}" (${a.version} at ${knownRoot}, ${b.version} at ${parsed.packageRoot}). Deduplicate the dependency or stop force-bundling it.`,
      );
    }
    packageRootByName.set(parsed.name, parsed.packageRoot);

    const { isEsm } = await readPackageMeta(parsed.packageRoot);
    const vendorId = path.join(
      vendorRoot,
      parsed.name,
      // Vendored IDs live under this package, so Rolldown would infer CJS/ESM
      // from *our* `package.json` type. Use an explicit extension instead.
      disambiguateJsExtension(parsed.subpath, isEsm),
    );

    realToVendor.set(resolved.id, vendorId);
    vendorToReal.set(vendorId, resolved.id);
    return { ...resolved, id: vendorId };
  }

  function readPackageMeta(packageRoot: string): Promise<PackageMeta> {
    const cached = packageMetaCache.get(packageRoot);
    if (cached != null) return cached;

    const meta = readFile(path.join(packageRoot, 'package.json'), 'utf8')
      .then((text): PackageMeta => {
        const json = JSON.parse(text);
        return {
          version: json.version ?? 'unknown',
          isEsm: json.type === 'module',
        };
      })
      .catch(
        (): PackageMeta => ({
          version: 'unknown',
          isEsm: false,
        }),
      );
    packageMetaCache.set(packageRoot, meta);
    return meta;
  }
}

function isBareSpecifier(id: string): boolean {
  return (
    !id.startsWith('\0') &&
    !id.startsWith('.') &&
    !id.startsWith('/') &&
    !path.isAbsolute(id)
  );
}

function matchesPackage(id: string, patterns: VendorBundledPackages): boolean {
  const name = packageNameFromSpecifier(id);
  return patterns.some((pattern) => {
    if (typeof pattern === 'string') {
      return name === pattern || id === pattern || id.startsWith(`${pattern}/`);
    }
    return pattern.test(name) || pattern.test(id);
  });
}

function packageNameFromSpecifier(id: string): string {
  if (id.startsWith('@')) {
    const parts = id.split('/');
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : id;
  }
  return id.split('/')[0]!;
}

function disambiguateJsExtension(subpath: string, isEsm: boolean): string {
  if (!subpath.endsWith('.js')) return subpath;
  return `${subpath.slice(0, -'.js'.length)}${isEsm ? '.mjs' : '.cjs'}`;
}

const NODE_MODULES = '/node_modules/';

function parseNodeModulesPath(id: string): ParsedNodeModulesPath | null {
  const slashed = id.replaceAll('\\', '/');
  const lastNmIdx = slashed.lastIndexOf(NODE_MODULES);
  if (lastNmIdx === -1) return null;

  const rest = slashed.slice(lastNmIdx + NODE_MODULES.length);
  const name = packageNameFromSpecifier(rest);
  if (name.startsWith('.')) return null;

  return {
    packageRoot: slashed.slice(
      0,
      lastNmIdx + NODE_MODULES.length + name.length,
    ),
    name,
    subpath: rest.slice(name.length).replace(/^\//, '') || 'index.js',
  };
}
