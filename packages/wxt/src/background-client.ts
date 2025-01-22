import { browser } from 'wxt/browser';
import { logger } from './sandbox/utils/logger';
import { MatchPattern } from 'wxt/sandbox';

console.log('HOT', import.meta.hot);
if (import.meta.hot) {
  import.meta.hot.on('wxt:reload-extension', () => browser.runtime.reload());
  import.meta.hot.on('wxt:reload-content-script', (event) =>
    reloadContentScript(event),
  );

  if (import.meta.env.MANIFEST_VERSION === 3) {
    let backgroundInitialized = false;
    // Tell the server the background script is loaded and ready to go
    import.meta.hot.on('vite:ws:connect', () => {
      if (backgroundInitialized) return;

      import.meta.hot?.send('wxt:background-initialized');
      backgroundInitialized = true;
    });

    // Web Socket will disconnect if the service worker is killed
    keepServiceWorkerAlive();
  }

  browser.commands.onCommand.addListener((command) => {
    if (command === 'wxt:reload-extension') {
      browser.runtime.reload();
    }
  });
} else {
  console.error('[wxt] HMR Context not found');
}

/**
 * https://developer.chrome.com/blog/longer-esw-lifetimes/
 */
function keepServiceWorkerAlive() {
  setInterval(async () => {
    // Calling an async browser API resets the service worker's timeout
    await browser.runtime.getPlatformInfo();
  }, 5e3);
}

function reloadContentScript(payload: ReloadContentScriptPayload) {
  const manifest = browser.runtime.getManifest();
  if (manifest.manifest_version == 2) {
    void reloadContentScriptMv2(payload);
  } else {
    void reloadContentScriptMv3(payload);
  }
}

async function reloadContentScriptMv3({
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

async function reloadManifestContentScriptMv3(contentScript: ContentScript) {
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

  await reloadTabsForContentScript(contentScript);
}

async function reloadRuntimeContentScriptMv3(contentScript: ContentScript) {
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
  await reloadTabsForContentScript(contentScript);
}

async function reloadTabsForContentScript(contentScript: ContentScript) {
  const allTabs = await browser.tabs.query({});
  const matchPatterns = contentScript.matches.map(
    (match) => new MatchPattern(match),
  );
  const matchingTabs = allTabs.filter((tab) => {
    const url = tab.url;
    if (!url) return false;
    return !!matchPatterns.find((pattern) => pattern.includes(url));
  });
  await Promise.all(
    matchingTabs.map(async (tab) => {
      try {
        await browser.tabs.reload(tab.id);
      } catch (err) {
        logger.warn('Failed to reload tab:', err);
      }
    }),
  );
}

async function reloadContentScriptMv2(_payload: ReloadContentScriptPayload) {
  throw Error('TODO: reloadContentScriptMv2');
}

interface ReloadContentScriptPayload {
  registration?: 'manifest' | 'runtime';
  contentScript: {
    matches: string[];
    js?: string[];
    css?: string[];
  };
}
