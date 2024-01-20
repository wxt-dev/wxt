import {
  BuildOutput,
  BuildStepOutput,
  EntrypointGroup,
  InternalConfig,
  OutputAsset,
  OutputFile,
} from '~/types';
import { every } from '~/core/utils/arrays';
import { normalizePath } from '~/core/utils/paths';

/**
 * Compare the changed files vs the build output and determine what kind of reload needs to happen:
 *
 * - Do nothing
 *   - CSS or JS file associated with an HTML page is changed - this is handled automatically by the
 *     dev server
 *   - Change isn't used by any of the entrypoints
 * - Reload Content script
 *   - CSS or JS file associated with a content script
 *   - Background script will be told to reload the content script
 * - Reload HTML file
 *   - HTML file itself is saved - HMR doesn't handle this because the HTML pages are pre-rendered
 *   - Chrome is OK reloading the page when the HTML file is changed without reloading the whole
 *     extension. Not sure about firefox, this might need to change to an extension reload
 * - Reload extension
 *   - Background script is changed
 *   - Manifest is different
 * - Restart browser
 *   - Config file changed (wxt.config.ts, .env, web-ext.config.ts, etc)
 */
export function detectDevChanges(
  config: InternalConfig,
  changedFiles: string[],
  currentOutput: BuildOutput,
): DevModeChange {
  const isConfigChange = changedFiles.some(
    (file) => file === config.userConfigMetadata.configFile,
  );
  if (isConfigChange) return { type: 'full-restart' };

  const changedSteps = new Set(
    changedFiles.flatMap((changedFile) =>
      findEffectedSteps(changedFile, currentOutput),
    ),
  );
  if (changedSteps.size === 0) return { type: 'no-change' };

  const unchangedOutput: BuildOutput = {
    manifest: currentOutput.manifest,
    steps: [],
    publicAssets: [],
  };
  const changedOutput: BuildOutput = {
    manifest: currentOutput.manifest,
    steps: [],
    publicAssets: [],
  };

  for (const step of currentOutput.steps) {
    if (changedSteps.has(step)) {
      changedOutput.steps.push(step);
    } else {
      unchangedOutput.steps.push(step);
    }
  }
  for (const asset of currentOutput.publicAssets) {
    if (changedSteps.has(asset)) {
      changedOutput.publicAssets.push(asset);
    } else {
      unchangedOutput.publicAssets.push(asset);
    }
  }

  const isOnlyHtmlChanges =
    changedFiles.length > 0 &&
    every(changedFiles, ([_, file]) => file.endsWith('.html'));
  if (isOnlyHtmlChanges) {
    return {
      type: 'html-reload',
      cachedOutput: unchangedOutput,
      rebuildGroups: changedOutput.steps.map((step) => step.entrypoints),
    };
  }

  const isOnlyContentScripts =
    changedOutput.steps.length > 0 &&
    every(
      changedOutput.steps.flatMap((step) => step.entrypoints),
      (entry) => entry.type === 'content-script',
    );
  if (isOnlyContentScripts) {
    return {
      type: 'content-script-reload',
      cachedOutput: unchangedOutput,
      changedSteps: changedOutput.steps,
      rebuildGroups: changedOutput.steps.map((step) => step.entrypoints),
    };
  }

  return {
    type: 'extension-reload',
    cachedOutput: unchangedOutput,
    rebuildGroups: changedOutput.steps.map((step) => step.entrypoints),
  };
}

/**
 * For a single change, return all the step of the build output that were effected by it.
 */
function findEffectedSteps(
  changedFile: string,
  currentOutput: BuildOutput,
): DetectedChange[] {
  const changes: DetectedChange[] = [];
  const changedPath = normalizePath(changedFile);

  const isChunkEffected = (chunk: OutputFile): boolean =>
    // If it's an HTML file with the same path, is is effected because HTML files need to be pre-rendered
    // fileName is normalized, relative bundle path
    (chunk.type === 'asset' && changedPath.endsWith(chunk.fileName)) ||
    // If it's a chunk that depends on the changed file, it is effected
    // moduleIds are absolute, normalized paths
    (chunk.type === 'chunk' && chunk.moduleIds.includes(changedPath));

  for (const step of currentOutput.steps) {
    const effectedChunk = step.chunks.find((chunk) => isChunkEffected(chunk));
    if (effectedChunk) changes.push(step);
  }

  const effectedAsset = currentOutput.publicAssets.find((chunk) =>
    isChunkEffected(chunk),
  );
  if (effectedAsset) changes.push(effectedAsset);

  return changes;
}

/**
 * Contains information about what files changed, what needs rebuilt, and the type of reload that is
 * required.
 */
export type DevModeChange =
  | NoChange
  | HtmlReload
  | ExtensionReload
  | ContentScriptReload
  | FullRestart;

interface NoChange {
  type: 'no-change';
}

interface RebuildChange {
  /**
   * The list of entrypoints that need rebuilt.
   */
  rebuildGroups: EntrypointGroup[];
  /**
   * The previous output stripped of any files are going to change.
   */
  cachedOutput: BuildOutput;
}

interface FullRestart {
  type: 'full-restart';
}

interface HtmlReload extends RebuildChange {
  type: 'html-reload';
}

interface ExtensionReload extends RebuildChange {
  type: 'extension-reload';
}

// interface BrowserRestart extends RebuildChange {
//   type: 'browser-restart';
// }

interface ContentScriptReload extends RebuildChange {
  type: 'content-script-reload';
  changedSteps: BuildStepOutput[];
}

/**
 * When figuring out what needs reloaded, this stores the step that was changed, or the public
 * directory asset that was changed. It doesn't know what type of change is required yet. Just an
 * intermediate type.
 */
type DetectedChange = BuildStepOutput | OutputAsset;
