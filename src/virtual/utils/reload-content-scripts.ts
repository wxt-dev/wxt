import { browser } from 'wxt/browser';
import { logger } from '../../sandbox/utils/logger';
import { MatchPattern } from 'wxt/sandbox';

interface ContentScript {
  matches: string[];
  js?: string[];
  css?: string[];
}

export function reloadContentScript(contentScript: ContentScript) {
  const manifest = browser.runtime.getManifest();
  if (manifest.manifest_version == 2) {
    void reloadContentScriptMv2(contentScript);
  } else {
    void reloadContentScriptMv3(contentScript);
  }
}

export async function reloadContentScriptMv3(contentScript: ContentScript) {
  const id = `wxt:${contentScript.js![0]}`;
  logger.log('Reloading content script:', contentScript);
  const registered = await browser.scripting.getRegisteredContentScripts();
  logger.debug('Existing scripts:', registered);

  const existing = registered.find((cs) => cs.id === id);

  if (existing) {
    logger.debug('Updating content script', existing);
    await browser.scripting.updateContentScripts([{ ...contentScript, id }]);
  } else {
    logger.debug('Registering new content script...');
    await browser.scripting.registerContentScripts([{ ...contentScript, id }]);
  }

  const allTabs = await browser.tabs.query({});
  const matchPatterns = contentScript.matches.map(
    (match) => new MatchPattern(match),
  );
  const matchingTabs = allTabs.filter((tab) => {
    const url = tab.url;
    if (!url) return false;
    return !!matchPatterns.find((pattern) => pattern.includes(url));
  });
  await Promise.all(matchingTabs.map((tab) => browser.tabs.reload(tab.id)));
}

export async function reloadContentScriptMv2(contentScript: ContentScript) {
  throw Error('TODO: reloadContentScriptMv2');
}
