import { browser } from 'wxt/browser';
import { logger } from '../../utils/internal/logger';
import { MatchPattern } from 'wxt/utils/match-patterns';
import type { ReloadContentScriptPayload } from '../../utils/internal/dev-server-websocket';

export function reloadContentScript(
  payload: ReloadContentScriptPayload,
): Promise<void> {
  const manifest = browser.runtime.getManifest();
  return manifest.manifest_version == 2
    ? reloadContentScriptMv2(payload)
    : reloadContentScriptMv3(payload);
}

export async function reloadContentScriptMv3({
  registration,
  contentScript,
}: ReloadContentScriptPayload) {
  if (registration === 'runtime') {
    await reloadRuntimeContentScriptMv3(contentScript);
  } else {
    await reloadManifestContentScriptMv3(contentScript);
  }
}

type ContentScript = ReloadContentScriptPayload['contentScript'];

export async function reloadManifestContentScriptMv3(
  contentScript: ContentScript,
) {
  const id = `wxt:${contentScript.js![0]}`;
  logger.log('Reloading content script:', contentScript);
  const registered = await browser.scripting.getRegisteredContentScripts();
  logger.debug('Existing scripts:', registered);

  const existing = registered.find((cs) => cs.id === id);

  if (existing) {
    logger.debug('Updating content script', existing);
    await browser.scripting.updateContentScripts([
      {
        ...contentScript,
        id,
        css: contentScript.css ?? [],
      },
    ]);
  } else {
    logger.debug('Registering new content script...');
    await browser.scripting.registerContentScripts([
      {
        ...contentScript,
        id,
        css: contentScript.css ?? [],
      },
    ]);
  }

  await reExecuteInMatchingTabs(contentScript);
}

export async function reloadRuntimeContentScriptMv3(
  contentScript: ContentScript,
) {
  logger.log('Reloading content script:', contentScript);
  const registered = await browser.scripting.getRegisteredContentScripts();
  logger.debug('Existing scripts:', registered);

  const matches = registered.filter((cs) => {
    const hasJs = contentScript.js?.find((js) => cs.js?.includes(js));
    const hasCss = contentScript.css?.find((css) => cs.css?.includes(css));
    return hasJs || hasCss;
  });

  if (matches.length === 0) {
    logger.log(
      'Content script is not registered yet, nothing to reload',
      contentScript,
    );
    return;
  }

  await browser.scripting.updateContentScripts(matches);
  await reExecuteInMatchingTabs(contentScript);
}

/**
 * Re-runs a content script's JS files inside tabs that already have it
 * injected, instead of doing a full `tabs.reload()`. A full reload works, but
 * it navigates the page, which clears devtools console output - making it hard
 * to tell whether the reload actually picked up the change. Running the updated
 * files in-place keeps the page (and previous logs) around, so the new console
 * output shows up right next to the old output.
 */
async function reExecuteInMatchingTabs(contentScript: ContentScript) {
  if (!contentScript.js?.length) return;

  const matchPatterns = contentScript.matches.map(
    (match) => new MatchPattern(match),
  );
  const allTabs = await browser.tabs.query({});
  const matchingTabs = allTabs.filter((tab) => {
    const url = tab.url;
    if (!url) return false;
    return !!matchPatterns.find((pattern) => pattern.includes(url));
  });
  await Promise.all(
    matchingTabs.map(async (tab) => {
      try {
        await browser.scripting.executeScript({
          target: { tabId: tab.id! },
          files: contentScript.js!,
          world: contentScript.world,
        });
      } catch (err) {
        logger.warn('Failed to reload tab:', err);
      }
    }),
  );
}

export async function reloadContentScriptMv2(
  _payload: ReloadContentScriptPayload,
) {
  throw Error('TODO: reloadContentScriptMv2');
}
