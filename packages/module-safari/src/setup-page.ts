import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * The host app `safari-web-extension-converter` generates is a dead end for
 * users: an icon and one sentence telling them to go turn the extension on,
 * with no indication of where. On iOS the path is four levels deep in Settings
 * and essentially undiscoverable. These replace the generated
 * Main.html/Style.css/Script.js with a real setup guide.
 */

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c]!);
}

export function setupPageHtml(projectName: string): string {
  const name = escapeHtml(projectName);
  return `<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
    <link rel="stylesheet" href="../Style.css">
    <script src="../Script.js" defer></script>
</head>
<body>
    <header>
        <img src="../Icon.png" width="96" height="96" alt="${name} icon">
        <h1>${name}</h1>
    </header>

    <section class="status platform-mac">
        <p class="state-on badge on">Extension is enabled</p>
        <p class="state-off badge off">Extension is disabled</p>
    </section>

    <section class="steps platform-mac">
        <h2>How to enable in Safari</h2>
        <ol>
            <li>Open <strong>Safari</strong></li>
            <li>Go to <strong class="settings-path">Safari → Preferences → Extensions</strong></li>
            <li>Check the box next to <strong>${name}</strong></li>
            <li>If prompted, click <strong>Allow</strong> to grant permissions</li>
        </ol>
        <button class="open-preferences">Open Safari Settings…</button>
    </section>

    <section class="steps platform-ios">
        <h2>How to enable in Safari</h2>
        <ol>
            <li>Open the <strong>Settings</strong> app</li>
            <li>Tap <strong>Apps → Safari → Extensions</strong></li>
            <li>Tap <strong>${name}</strong> and turn it on</li>
            <li>Under Permissions, set the listed websites to <strong>Allow</strong></li>
        </ol>
        <p class="hint">Then open Safari and tap the extensions button in the address bar to use ${name}.</p>
    </section>
</body>
</html>
`;
}

export function setupPageCss(): string {
  return `* {
    -webkit-user-select: none;
    -webkit-user-drag: none;
    cursor: default;
}

:root {
    color-scheme: light dark;
    --spacing: 20px;
    --accent: #007aff;
    --badge-bg: #f2f2f7;
    --text-secondary: #8e8e93;
    --green: #34c759;
    --red: #ff3b30;
}

@media (prefers-color-scheme: dark) {
    :root {
        --badge-bg: #2c2c2e;
        --text-secondary: #98989d;
    }
}

html {
    height: 100%;
}

body {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: var(--spacing);
    margin: 0 calc(var(--spacing) * 2);
    height: 100%;
    font: -apple-system-short-body;
    text-align: center;
    /* Scroll rather than clip: the window is sized for the standard guide,
       but a long extension name can still push past it. */
    overflow-y: auto;
}

/* Until a platform is known, show neither platform's content. */
body:not(.platform-mac, .platform-ios) :is(.platform-mac, .platform-ios) {
    display: none;
}
body.platform-mac .platform-ios { display: none; }
body.platform-ios .platform-mac { display: none; }

/* Until the state is actually known the badge is absent, not pending. A
   single-platform project's ViewController gives up silently when the
   extension-state lookup fails, so a "checking…" placeholder would sit there
   forever and read as a hang. */
body:not(.state-on, .state-off) .status {
    display: none;
}
body.state-on .state-off { display: none; }
body.state-off .state-on { display: none; }

header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

h1 {
    font-size: 1.4em;
    font-weight: 600;
    margin: 0;
}

.status {
    margin: 0;
}

.badge {
    display: inline-block;
    margin: 0;
    padding: 4px 14px;
    border-radius: 12px;
    font-size: 0.85em;
    font-weight: 500;
    background: var(--badge-bg);
}
.badge.on { color: var(--green); }
.badge.off { color: var(--red); }

.steps {
    text-align: left;
    width: 100%;
    max-width: 360px;
}

.steps h2 {
    font-size: 1em;
    font-weight: 600;
    margin: 0 0 8px;
    text-align: center;
}

.steps ol {
    margin: 0;
    padding-left: 1.6em;
}

.steps li {
    margin-bottom: 6px;
    line-height: 1.4;
}

.steps li:last-child {
    margin-bottom: 0;
}

button {
    display: block;
    width: 100%;
    margin-top: 14px;
    padding: 10px 20px;
    font-size: 0.95em;
    font-weight: 500;
    color: white;
    background: var(--accent);
    border: none;
    border-radius: 10px;
    cursor: pointer;
}

button:active {
    opacity: 0.7;
}

.hint {
    margin-top: 12px;
    margin-bottom: 0;
    font-size: 0.85em;
    color: var(--text-secondary);
    text-align: center;
}
`;
}

export function setupPageScript(): string {
  return `// The generated ViewController calls show() with a different signature
// depending on how the project was converted: a macOS/iOS project passes the
// platform first, a single-platform project omits it. Sniff rather than
// require a matching ViewController, so this file works with any layout the
// converter produces.
function show(a, b, c) {
    var hasPlatform = typeof a === 'string';
    var platform = hasPlatform ? a : 'mac';
    var enabled = hasPlatform ? b : a;
    var useSettingsInsteadOfPreferences = hasPlatform ? c : b;

    document.body.classList.toggle('platform-mac', platform === 'mac');
    document.body.classList.toggle('platform-ios', platform === 'ios');

    // "Preferences" was renamed to "Settings" in macOS 13.
    if (useSettingsInsteadOfPreferences) {
        var paths = document.querySelectorAll('.settings-path');
        for (var i = 0; i < paths.length; i++) {
            paths[i].textContent = 'Safari → Settings → Extensions';
        }
        var button = document.querySelector('button.open-preferences');
        if (button) button.textContent = 'Open Safari Settings…';
    }

    if (typeof enabled === 'boolean') {
        document.body.classList.toggle('state-on', enabled);
        document.body.classList.toggle('state-off', !enabled);
    } else {
        document.body.classList.remove('state-on');
        document.body.classList.remove('state-off');
    }
}

function openPreferences() {
    webkit.messageHandlers.controller.postMessage('open-preferences');
}

var openButton = document.querySelector('button.open-preferences');
if (openButton) openButton.addEventListener('click', openPreferences);

// A single-platform project's generated ViewController only calls show() if
// the extension-state lookup succeeds — it bails out on error without telling
// the page anything. Since the instructions are hidden until a platform is
// known, that left the window showing nothing but the icon. Seed the platform
// here so content always renders; a later show() from native still refines it.
if (!/platform-(mac|ios)/.test(document.body.className)) {
    var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
        (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
    show(isIOS ? 'ios' : 'mac');
}
`;
}

/**
 * The converter sizes the macOS window for its one-sentence placeholder, which
 * clips the guide. Both the window's contentRect and the view/webview frames
 * carry the same height, so a plain substitution covers all of them.
 */
export function resizeMacWindow(
  storyboard: string,
  from = 325,
  to = 480,
): string {
  return storyboard.replaceAll(`height="${from}"`, `height="${to}"`);
}

async function exists(target: string): Promise<boolean> {
  return fs
    .access(target)
    .then(() => true)
    .catch(() => false);
}

/**
 * Converting for both platforms groups sources under `Shared (App)`/`macOS
 * (App)`; converting for one platform lays them out flat under the project
 * name. Probe rather than infer from projectType — the layout is the
 * converter's decision, and this stays correct if that changes.
 */
export async function resolveAppPaths(
  projectRoot: string,
  projectName: string,
): Promise<{ resources: string; macStoryboard: string } | undefined> {
  const candidates = [
    {
      app: path.join(projectRoot, 'Shared (App)'),
      storyboard: path.join(
        projectRoot,
        'macOS (App)',
        'Base.lproj',
        'Main.storyboard',
      ),
    },
    {
      app: path.join(projectRoot, projectName),
      storyboard: path.join(
        projectRoot,
        projectName,
        'Base.lproj',
        'Main.storyboard',
      ),
    },
  ];
  for (const candidate of candidates) {
    const resources = path.join(candidate.app, 'Resources');
    if (await exists(resources))
      return { resources, macStoryboard: candidate.storyboard };
  }
  return undefined;
}

export interface WriteSetupPageOptions {
  projectName: string;
  projectRoot: string;
}

/**
 * Returns false when the expected layout isn't there, so the caller can warn
 * without failing the build.
 */
export async function writeSetupPage(
  options: WriteSetupPageOptions,
): Promise<boolean> {
  const paths = await resolveAppPaths(options.projectRoot, options.projectName);
  if (!paths) return false;

  await fs.writeFile(
    path.join(paths.resources, 'Base.lproj', 'Main.html'),
    setupPageHtml(options.projectName),
  );
  await fs.writeFile(path.join(paths.resources, 'Style.css'), setupPageCss());
  await fs.writeFile(
    path.join(paths.resources, 'Script.js'),
    setupPageScript(),
  );

  // iOS-only projects have no macOS storyboard, and iOS is full-screen anyway.
  if (await exists(paths.macStoryboard)) {
    const storyboard = await fs.readFile(paths.macStoryboard, 'utf-8');
    await fs.writeFile(paths.macStoryboard, resizeMacWindow(storyboard));
  }

  return true;
}
