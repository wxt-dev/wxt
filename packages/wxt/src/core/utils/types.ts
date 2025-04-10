import type { Browser } from '@wxt-dev/browser';

/**
 * Remove optional from key, but keep undefined if present
 *
 * @example
 * type Test = NullablyRequired<{a?: string, b: number}>
 * // type Test = {a: string | undefined, b: number}
 */
export type NullablyRequired<T> = { [K in keyof Required<T>]: T[K] };

export type ManifestContentScript = NonNullable<
  Browser.runtime.Manifest['content_scripts']
>[number];

export type ManifestV3WebAccessibleResource = NonNullable<
  Browser.runtime.ManifestV3['web_accessible_resources']
>[number];
