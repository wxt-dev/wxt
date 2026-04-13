/**
 * Runtime registry for content script built artifact paths.
 *
 * This module provides access to the post-bundle file paths for content scripts
 * defined with `registration: "runtime"`, enabling dynamic registration via
 * `browser.scripting.registerContentScripts()`.
 *
 * @module wxt/client/content-script-registry
 */

export interface ContentScriptArtifacts {
  /** Bundled JavaScript file paths */
  js: string[];
  /** Bundled CSS file paths */
  css: string[];
}

const registry = new Map<string, ContentScriptArtifacts>();

/**
 * Register content script artifacts at runtime. Called automatically by the
 * build system for content scripts with `registration: "runtime"`.
 *
 * @internal
 */
export function registerContentScriptArtifacts(
  id: string,
  artifacts: ContentScriptArtifacts,
): void {
  registry.set(id, artifacts);
}

/**
 * Get the built artifact paths for a content script by its ID.
 *
 * @param id The content script ID (usually the entrypoint name)
 * @returns The artifact paths, or undefined if not found
 *
 * @example
 * const artifacts = getContentScriptArtifacts('content-script');
 * if (artifacts) {
 *   await browser.scripting.registerContentScripts([{
 *     id: 'content-script',
 *     js: artifacts.js,
 *     css: artifacts.css,
 *     matches: ['<all_urls>'],
 *   }]);
 * }
 */
export function getContentScriptArtifacts(
  id: string,
): ContentScriptArtifacts | undefined {
  return registry.get(id);
}

/**
 * Check if artifacts exist for a content script ID.
 */
export function hasContentScriptArtifacts(id: string): boolean {
  return registry.has(id);
}

/**
 * Get all registered content script IDs.
 */
export function getContentScriptIds(): string[] {
  return Array.from(registry.keys());
}
