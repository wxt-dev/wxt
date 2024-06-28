export function initBackground() {
  console.log('Initializing WXT devtools in background');
  setupContextMenuItem();
}

/**
 * Add a context menu item to open devtools.
 */
function setupContextMenuItem() {
  const openMenuItemId = 'open-wxt-devtools';
  chrome.contextMenus.remove(openMenuItemId, () => chrome.runtime.lastError);
  chrome.contextMenus.create({
    id: openMenuItemId,
    title: 'Open WXT Devtools',
    contexts: ['all'],
  });
  chrome.contextMenus.onClicked.addListener(({ menuItemId }) => {
    if (menuItemId === openMenuItemId) showDevtoolsPopup();
  });
}

async function showDevtoolsPopup() {
  try {
    const devtoolsUrl = chrome.runtime.getURL('/wxt-devtools.html');

    const [tab] = (await chrome.tabs.query({ url: devtoolsUrl })) ?? [];

    if (tab) {
      // Devtools already open, focus on it
      await chrome.windows.update(tab.windowId, { focused: true });
    } else {
      // Not open yet, open in a separate window
      await chrome.windows.create({
        url: devtoolsUrl,
        type: 'popup',
        width: 500,
        height: 600,
      });
    }
  } catch (err) {
    console.error('[devtools] Failed to open devtools', err);
  }
}
