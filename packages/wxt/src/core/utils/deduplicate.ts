import { readFile, unlink } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import type { Manifest } from 'webextension-polyfill';

/**
 * Scans the build output directory for CSS files that exist in both the assets
 * folder and the content-scripts folder. Files with identical content are
 * considered duplicates, and the versions in the assets folder are removed
 * since the manifest already references the content-scripts versions.
 *
 * @param outDir The build output directory
 * @param manifest The extension manifest containing content script CSS references
 * @returns Array of absolute paths to removed files
 */
export async function deduplicateContentScriptCss(
  outDir: string,
  manifest: Manifest.WebExtensionManifest,
): Promise<string[]> {
  const removed: string[] = [];

  if (!manifest.content_scripts?.length) {
    return removed;
  }

  const cssPaths = new Set<string>();
  for (const cs of manifest.content_scripts) {
    if (cs.css) {
      for (const css of cs.css) {
        cssPaths.add(css);
      }
    }
  }

  for (const cssPath of cssPaths) {
    const contentScriptFile = resolve(outDir, cssPath);
    const assetFile = resolve(outDir, 'assets', basename(cssPath));

    try {
      const [contentScriptData, assetData] = await Promise.all([
        readFile(contentScriptFile),
        readFile(assetFile).catch(() => null),
      ]);

      if (assetData === null) continue;

      if (contentScriptData.equals(assetData)) {
        await unlink(assetFile);
        removed.push(assetFile);
      }
    } catch {
      // Ignore files that can't be read
    }
  }

  return removed;
}
