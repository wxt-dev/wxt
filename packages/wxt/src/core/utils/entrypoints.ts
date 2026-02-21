import {
  Entrypoint,
  PerBrowserOption,
  ResolvedPerBrowserOptions,
  TargetBrowser,
} from '../../types';
import path, { relative, resolve, extname } from 'node:path';
import { normalizePath } from './paths';

export function getEntrypointName(
  entrypointsDir: string,
  inputPath: string,
  // type: Entrypoint['type'],
): string {
  const relativePath = path.relative(entrypointsDir, inputPath);
  // Grab the string up to the first . or / or \\
  const name = relativePath.split(/[./\\]/, 2)[0];

  return name;
}

export function getEntrypointOutputFile(
  entrypoint: Entrypoint,
  ext: string,
): string {
  return resolve(entrypoint.outputDir, `${entrypoint.name}${ext}`);
}

/**
 * Return's the entrypoint's output path relative to the output directory. Used for paths in the
 * manifest and rollup's bundle.
 */
export function getEntrypointBundlePath(
  entrypoint: Entrypoint,
  outDir: string,
  ext: string,
): string {
  return normalizePath(
    relative(outDir, getEntrypointOutputFile(entrypoint, ext)),
  );
}

/**
 * Given an entrypoint option, resolve it's value based on a target browser.
 */
export function resolvePerBrowserOption<T>(
  option: PerBrowserOption<T>,
  browser: TargetBrowser,
): T {
  if (typeof option === 'object' && !Array.isArray(option))
    return (option as any)[browser];
  return option;
}

/**
 * Given an entrypoint option, resolve it's value based on a target browser.
 *
 * defaultIcon is special, it's the only key that's a record, which can confuse this function. So
 * it's been manually excluded from resolution.
 */
export function resolvePerBrowserOptions<
  T extends Record<string, any>,
  TKeys extends keyof T,
>(options: T, browser: TargetBrowser): ResolvedPerBrowserOptions<T, TKeys> {
  // @ts-expect-error: Object.entries is untyped.
  return Object.fromEntries(
    Object.entries(options).map(([key, value]) => [
      key,
      key === 'defaultIcon' ? value : resolvePerBrowserOption(value, browser),
    ]),
  );
}

/**
 * Returns true when the entrypoint is an HTML entrypoint.
 *
 * Naively just checking the file extension of the input path.
 */
export function isHtmlEntrypoint(
  entrypoint: Pick<Entrypoint, 'inputPath'>,
): boolean {
  const ext = extname(entrypoint.inputPath);
  return ['.html'].includes(ext);
}

/**
 * Returns true when the entrypoint is a JS entrypoint.
 *
 * Naively just checking the file extension of the input path.
 */
export function isJsEntrypoint(
  entrypoint: Pick<Entrypoint, 'inputPath'>,
): boolean {
  const ext = extname(entrypoint.inputPath);
  return ['.js', '.jsx', '.ts', '.tsx'].includes(ext);
}
