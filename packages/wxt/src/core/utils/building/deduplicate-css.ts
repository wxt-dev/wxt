import { readFile, rm } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { BuildOutput, OutputAsset } from '../../../types';
import { wxt } from '../../wxt';

/**
 * Deduplicates CSS files in the build output by removing identical files from
 * the assets/ directory that are already present in content-scripts/.
 *
 * This handles the case where content script CSS files are output to both:
 *
 * 1. Content-scripts/${name}.css (referenced in manifest)
 * 2. Assets/${name}.css (duplicate, not needed)
 *
 * Only removes files with the same base name AND identical content.
 *
 * @param output The build output containing all generated files
 */
export async function deduplicateCss(
  output: Omit<BuildOutput, 'manifest'>,
): Promise<void> {
  const allAssets = output.steps.flatMap((step) =>
    step.chunks.filter((chunk): chunk is OutputAsset => chunk.type === 'asset'),
  );

  // Find all CSS files in content-scripts/ directory
  const contentScriptCss = allAssets.filter(
    (asset) =>
      asset.fileName.startsWith('content-scripts/') &&
      asset.fileName.endsWith('.css'),
  );

  if (contentScriptCss.length === 0) {
    return; // No content script CSS to deduplicate
  }

  // Find potential duplicates in assets/ directory
  const assetsCss = allAssets.filter(
    (asset) =>
      asset.fileName.startsWith('assets/') && asset.fileName.endsWith('.css'),
  );

  // Check each asset CSS file to see if it's a duplicate
  for (const assetFile of assetsCss) {
    const assetBaseName = basename(assetFile.fileName);
    const assetPath = resolve(wxt.config.outDir, assetFile.fileName);
    let assetContent: string;

    try {
      assetContent = await readFile(assetPath, 'utf-8');
    } catch {
      // File doesn't exist or can't be read, skip it
      continue;
    }

    // Compare with content-script CSS files that have the same base name
    for (const csFile of contentScriptCss) {
      const csBaseName = basename(csFile.fileName);

      // Only compare files with matching base names
      if (assetBaseName !== csBaseName) {
        continue;
      }

      const csPath = resolve(wxt.config.outDir, csFile.fileName);
      let csContent: string;

      try {
        csContent = await readFile(csPath, 'utf-8');
      } catch {
        continue;
      }

      // If base names match AND contents are identical, remove the duplicate from assets/
      if (assetContent === csContent) {
        wxt.logger.debug(
          `Removing duplicate CSS: ${assetFile.fileName} (identical to ${csFile.fileName})`,
        );

        await rm(assetPath, { force: true });

        // Remove from output chunks
        for (const step of output.steps) {
          const index = step.chunks.findIndex(
            (chunk) => chunk.fileName === assetFile.fileName,
          );
          if (index !== -1) {
            step.chunks.splice(index, 1);
          }
        }

        break; // Found and removed duplicate, move to next asset
      }
    }
  }
}
