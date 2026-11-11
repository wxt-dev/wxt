<script setup lang="ts">
import { computed, ref } from 'vue';

import art from '../../../assets/art002e009298.jpg';

type Token = { t: string; c?: string };

const KEYWORDS = /^(export|default|import|from|const|let|return|await)$/;
function tokenize(line: string): Token[] {
  const out: Token[] = [];
  const re =
    /(\/\/.*$)|('[^']*')|("[^"]*")(?=\s*:)|("[^"]*")|([A-Za-z_$][\w$]*)(?=\()|([A-Za-z_$][\w$]*)|(\s+)|(.)/g;
  for (const m of line.matchAll(re)) {
    if (m[1]) out.push({ t: m[1], c: 'cm' });
    else if (m[2] || m[4]) out.push({ t: m[0], c: 'st' });
    else if (m[3]) out.push({ t: m[3], c: 'fn' });
    else if (m[5]) out.push({ t: m[5], c: 'fn' });
    else if (m[6])
      out.push({ t: m[6], c: KEYWORDS.test(m[6]) ? 'kw' : undefined });
    else out.push({ t: m[0], c: m[8] ? 'pn' : undefined });
  }
  return out;
}
const hl = (src: string) => src.split('\n').map(tokenize);

/* ---------- hero ---------- */
const heroSources: Record<string, string> = {
  'background.ts': `export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    console.log('Hello background!', browser.runtime.id);
  });
});`,
  'content.ts': `export default defineContentScript({
  matches: ['*://*.google.com/*'],
  main() {
    console.log('Hello content script!');
  },
});`,
  'popup/main.ts': `import { createApp } from 'vue';
import App from './App.vue';

// Auto-imports and HMR work out of the box
createApp(App).mount('#app');`,
};
const heroTree = [
  { name: 'entrypoints', dir: true, depth: 0 },
  { name: 'background.ts', file: 'background.ts', depth: 1 },
  { name: 'content.ts', file: 'content.ts', depth: 1 },
  { name: 'popup', dir: true, depth: 1 },
  { name: 'main.ts', file: 'popup/main.ts', depth: 2 },
  { name: 'index.html', depth: 2 },
  { name: 'components', dir: true, depth: 0 },
  { name: 'wxt.config.ts', depth: 0 },
  { name: 'package.json', depth: 0 },
];
const heroActive = ref('background.ts');
const heroLines = computed(() => hl(heroSources[heroActive.value]));

/* ---------- entrypoints -> manifest ---------- */
const entrypoints = [
  {
    file: 'background.ts',
    code: `export default defineBackground(() => {
  console.log('Service worker started');
});`,
    manifest: `{
  "background": {
    "service_worker": "background.js"
  }
}`,
  },
  {
    file: 'content.ts',
    code: `export default defineContentScript({
  matches: ['*://*.github.com/*'],
  main() {
    console.log('Hello GitHub!');
  },
});`,
    manifest: `{
  "content_scripts": [
    {
      "matches": ["*://*.github.com/*"],
      "js": ["content-scripts/content.js"]
    }
  ]
}`,
  },
  {
    file: 'popup/index.html',
    code: `<!doctype html>
<html>
  <head>
    <meta name="manifest.type" content="browser_action" />
    <title>My Popup</title>
  </head>
  <body><div id="app"></div></body>
</html>`,
    manifest: `{
  "action": {
    "default_title": "My Popup",
    "default_popup": "popup.html"
  }
}`,
  },
  {
    file: 'options/index.html',
    code: `<!doctype html>
<html>
  <head>
    <title>My Options</title>
  </head>
  <body><div id="app"></div></body>
</html>`,
    manifest: `{
  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  }
}`,
  },
];
const epActive = ref(0);
const epCode = computed(() => hl(entrypoints[epActive.value].code));
const epManifest = computed(() => hl(entrypoints[epActive.value].manifest));

/* ---------- browsers ---------- */
const browsers = [
  {
    name: 'Chrome',
    flag: '',
    target: 'chrome-mv3',
    mv: '3',
    manifest: `{
  "manifest_version": 3,
  "background": {
    "service_worker": "background.js"
  }
}`,
  },
  {
    name: 'Firefox',
    flag: '-b firefox',
    target: 'firefox-mv2',
    mv: '2',
    manifest: `{
  "manifest_version": 2,
  "background": {
    "scripts": ["background.js"]
  }
}`,
  },
  {
    name: 'Edge',
    flag: '-b edge',
    target: 'edge-mv3',
    mv: '3',
    manifest: `{
  "manifest_version": 3,
  "background": {
    "service_worker": "background.js"
  }
}`,
  },
  {
    name: 'Safari',
    flag: '-b safari',
    target: 'safari-mv2',
    mv: '2',
    manifest: `{
  "manifest_version": 2,
  "background": {
    "scripts": ["background.js"]
  }
}`,
  },
];
const brActive = ref(0);
const br = computed(() => browsers[brActive.value]);
const brManifest = computed(() => hl(br.value.manifest));

/* ---------- features ---------- */
const groups = [
  {
    name: 'Build',
    items: [
      [
        'File Based Entrypoints',
        'Manifest is generated based on files in the project with inline configuration.',
        'M4 4h6l2 2h8v14H4z',
      ],
      [
        'MV2 and MV3',
        'Build Manifest V2 or V3 extensions for any browser using the same codebase.',
        'M7 7h10v10H7zM3 9h4M3 15h4M17 9h4M17 15h4',
      ],
      [
        'Supported Browsers',
        'WXT will build extensions for Chrome, Firefox, Edge, Safari, and any Chromium based browser.',
        'M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
      ],
      [
        'Frontend Framework Agnostic',
        'Works with any front-end framework with a Vite plugin.',
        'M4 4h16v16H4zM4 9h16M9 9v11',
      ],
    ],
  },
  {
    name: 'Develop',
    items: [
      [
        'Fast Dev Mode',
        'Lightning fast HMR for UI development and fast reloads for content/background scripts enables faster iterations.',
        'M13 2L4 14h7l-1 8 9-12h-7z',
      ],
      [
        'Auto-imports',
        'Nuxt-like auto-imports to speed up development.',
        'M12 3v12M7 10l5 5 5-5M4 20h16',
      ],
      [
        'TypeScript',
        'Create large projects with confidence using TS by default.',
        'M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14',
      ],
      [
        'Module System',
        'Reuse build-time and runtime-code across multiple extensions.',
        'M12 2l9 5v10l-9 5-9-5V7zM12 12l9-5M12 12v10M12 12L3 7',
      ],
    ],
  },
  {
    name: 'Ship',
    items: [
      [
        'Automated Publishing',
        'Automatically zip, upload, submit, and publish extensions.',
        'M12 21V9M7 14l5-5 5 5M4 4h16',
      ],
      [
        'Bundle Analysis',
        "Tools for analyzing the final extension bundle and minimizing your extension's size.",
        'M4 20V10M10 20V4M16 20v-8M22 20H2',
      ],
      [
        'Bootstrap a New Project',
        'Get started quickly with several awesome project templates.',
        'M12 5v14M5 12h14',
      ],
    ],
  },
];
</script>

<template>
  <div class="edf">
    <!-- HERO -->
    <section class="hero" :style="{ '--art': `url(${art})` }">
      <div class="photo" aria-hidden="true" />
      <div class="inner">
        <div class="copy">
          <img
            class="logo"
            src="/hero-logo.svg"
            alt=""
            width="56"
            height="56"
          />
          <p class="name">WXT</p>
          <h1>Next-gen Web Extension Framework</h1>
          <p class="tagline">
            An open source tool that makes web extension development faster than
            ever before.
          </p>
          <div class="cta">
            <a class="btn primary" href="/guide/installation">Get Started</a>
            <a class="btn" href="/guide/introduction">Learn More</a>
          </div>
        </div>

        <div
          class="win"
          role="group"
          aria-label="Mock editor with build output"
        >
          <div class="titlebar">
            <span class="lights" aria-hidden="true"><i /><i /><i /></span>
            <span class="title">my-extension</span>
          </div>
          <div class="body">
            <nav class="tree" aria-label="Project files">
              <button
                v-for="(n, i) in heroTree"
                :key="i"
                class="node"
                :class="{
                  dir: n.dir,
                  on: n.file && n.file === heroActive,
                  link: n.file,
                }"
                :style="{ paddingLeft: 10 + n.depth * 12 + 'px' }"
                :disabled="!n.file"
                @click="n.file && (heroActive = n.file)"
              >
                <span class="chev" aria-hidden="true">{{
                  n.dir ? '›' : ''
                }}</span
                >{{ n.name }}
              </button>
            </nav>
            <div class="main">
              <div class="tabbar">
                <span class="tab on">{{ heroActive }}</span>
              </div>
              <pre class="code"><code><span
                v-for="(line, i) in heroLines"
                :key="heroActive + i"
                class="ln"
              ><span class="num">{{ i + 1 }}</span><span
                  v-for="(tok, j) in line"
                  :key="j"
                  :class="tok.c"
                >{{ tok.t }}</span></span></code></pre>
              <div class="dock">
                <div class="dock-head">Terminal</div>
                <div class="term">
                  <p><span class="p">~/my-extension</span> wxt build</p>
                  <p class="dim">WXT <b>0.21.5</b></p>
                  <p>
                    <span class="info">ℹ</span> Building
                    <span class="cyan">chrome-mv3</span> for
                    <span class="cyan">production</span> with
                    <span class="grn">Vite 7.1.0</span>
                  </p>
                  <p><span class="ok">✔</span> Built extension in 959 ms</p>
                  <p class="dim">
                    &nbsp;&nbsp;└─ .output/chrome-mv3/<span class="cyan"
                      >manifest.json</span
                    >
                    559 B
                  </p>
                  <p><span class="cyan">Σ</span> Total size: 122.62 kB</p>
                </div>
              </div>
            </div>
          </div>
          <div class="statusbar">
            <span class="item">Built in <b>959 ms</b></span>
            <span class="item">Total <b>122.62 kB</b></span>
            <span class="item">Target <b>chrome-mv3</b></span>
            <span class="item right">TypeScript</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ENTRYPOINTS -->
    <section class="section">
      <header class="head">
        <div class="eyebrow">File based entrypoints</div>
        <h2>Your file tree is your manifest.</h2>
        <p>
          Drop a file in <code>entrypoints/</code> and WXT wires up the
          manifest, bundling, and reloading. Pick a file to see what it
          generates.
        </p>
      </header>
      <div class="win wide">
        <div class="titlebar">
          <span class="lights" aria-hidden="true"><i /><i /><i /></span>
          <span class="title">my-extension</span>
        </div>
        <div class="body three">
          <nav class="tree" aria-label="Entrypoints">
            <div class="node dir"><span class="chev">›</span>entrypoints</div>
            <button
              v-for="(e, i) in entrypoints"
              :key="e.file"
              class="node link"
              :class="{ on: i === epActive }"
              style="padding-left: 22px"
              @click="epActive = i"
            >
              {{ e.file }}
            </button>
          </nav>
          <div class="pane">
            <div class="tabbar">
              <span class="tab on">{{ entrypoints[epActive].file }}</span>
            </div>
            <pre class="code"><code><span
              v-for="(line, i) in epCode"
              :key="epActive + 'c' + i"
              class="ln"
            ><span class="num">{{ i + 1 }}</span><span
                v-for="(tok, j) in line"
                :key="j"
                :class="tok.c"
              >{{ tok.t }}</span></span></code></pre>
          </div>
          <div class="pane right">
            <div class="tabbar">
              <span class="tab on">.output/chrome-mv3/manifest.json</span>
            </div>
            <pre class="code"><code><span
              v-for="(line, i) in epManifest"
              :key="epActive + 'm' + i"
              class="ln"
            ><span class="num">{{ i + 1 }}</span><span
                v-for="(tok, j) in line"
                :key="j"
                :class="tok.c"
              >{{ tok.t }}</span></span></code></pre>
          </div>
        </div>
      </div>
    </section>

    <!-- DEV MODE -->
    <section class="section split">
      <div class="head left">
        <div class="eyebrow">Fast dev mode</div>
        <h2>Save. See it. Instantly.</h2>
        <p>
          <code>wxt</code> starts a dev server, opens a browser with your
          extension installed, and hot reloads UI. Content and background
          scripts reload without a manual refresh.
        </p>
        <ul class="points">
          <li>HMR for popup, options, and other UI pages</li>
          <li>Automatic reloads for content and background scripts</li>
          <li>Auto-imports and full TypeScript support</li>
        </ul>
      </div>
      <div class="win">
        <div class="titlebar">
          <span class="lights" aria-hidden="true"><i /><i /><i /></span>
          <span class="title">Terminal — wxt</span>
        </div>
        <div class="term big">
          <p><span class="p">~/my-extension</span> wxt</p>
          <p class="dim">WXT <b>0.21.5</b></p>
          <p>
            <span class="info">ℹ</span> Starting dev server for
            <span class="cyan">chrome-mv3</span>
          </p>
          <p><span class="ok">✔</span> Built extension in 1.1 s</p>
          <p><span class="ok">✔</span> Opened browser in 822 ms</p>
          <p class="gap dim">// You edit popup/App.vue…</p>
          <p>
            <span class="ok">✔</span> Hot updated
            <span class="cyan">popup</span>
          </p>
          <p class="dim">// …then content.ts</p>
          <p>
            <span class="ok">✔</span> Rebuilt
            <span class="cyan">content-scripts/content.js</span> in 31 ms
          </p>
          <p><span class="info">ℹ</span> Reloading content script…</p>
        </div>
        <div class="statusbar">
          <span class="item">Dev server <b>localhost:3000</b></span>
          <span class="item">Target <b>chrome-mv3</b></span>
        </div>
      </div>
    </section>

    <!-- BROWSERS -->
    <section class="section">
      <header class="head">
        <div class="eyebrow">Cross browser</div>
        <h2>One codebase. Every browser.</h2>
        <p>
          Pick a target. WXT handles the manifest version and browser
          differences for you.
        </p>
      </header>
      <div class="tabs" role="tablist" aria-label="Browser">
        <button
          v-for="(b, i) in browsers"
          :key="b.name"
          role="tab"
          :aria-selected="i === brActive"
          :class="{ on: i === brActive }"
          @click="brActive = i"
        >
          {{ b.name }}
        </button>
      </div>
      <div class="win wide two">
        <div class="titlebar">
          <span class="lights" aria-hidden="true"><i /><i /><i /></span>
          <span class="title">my-extension</span>
        </div>
        <div class="body two-col">
          <div class="pane">
            <div class="tabbar"><span class="tab on">Terminal</span></div>
            <div class="term big">
              <p>
                <span class="p">~/my-extension</span> wxt build
                <span v-if="br.flag">{{ br.flag }}</span>
              </p>
              <p class="dim">WXT <b>0.21.5</b></p>
              <p>
                <span class="info">ℹ</span> Building
                <span class="cyan">{{ br.target }}</span> for
                <span class="cyan">production</span> with
                <span class="grn">Vite 7.1.0</span>
              </p>
              <p><span class="ok">✔</span> Built extension in 959 ms</p>
              <p><span class="cyan">Σ</span> Total size: 122.62 kB</p>
            </div>
          </div>
          <div class="pane right">
            <div class="tabbar">
              <span class="tab on">.output/{{ br.target }}/manifest.json</span>
            </div>
            <pre class="code"><code><span
              v-for="(line, i) in brManifest"
              :key="brActive + 'b' + i"
              class="ln"
            ><span class="num">{{ i + 1 }}</span><span
                v-for="(tok, j) in line"
                :key="j"
                :class="tok.c"
              >{{ tok.t }}</span></span></code></pre>
          </div>
        </div>
        <div class="statusbar">
          <span class="item">Manifest <b>MV{{ br.mv }}</b></span>
          <span class="item">Target <b>{{ br.target }}</b></span>
        </div>
      </div>
    </section>

    <!-- PUBLISH -->
    <section class="section split flip">
      <div class="head left">
        <div class="eyebrow">Automated publishing</div>
        <h2>Zip. Submit. Done.</h2>
        <p>
          Package your extension for every store and publish updates from your
          terminal or CI, with no manual uploads.
        </p>
        <a class="link" href="/guide/essentials/publishing"
          >Read the publishing guide →</a
        >
      </div>
      <div class="win">
        <div class="titlebar">
          <span class="lights" aria-hidden="true"><i /><i /><i /></span>
          <span class="title">Terminal — wxt submit</span>
        </div>
        <div class="term big">
          <p><span class="p">~/my-extension</span> wxt zip -b firefox</p>
          <p><span class="ok">✔</span> Zipped extension in 412 ms</p>
          <p class="dim">
            &nbsp;&nbsp;└─ .output/my-extension-1.0.0-firefox.zip
            <span class="sz">38.1 kB</span>
          </p>
          <p class="gap"><span class="p">~/my-extension</span> wxt submit</p>
          <p><span class="info">ℹ</span> Submitting to Chrome Web Store…</p>
          <p><span class="info">ℹ</span> Submitting to Firefox Addons…</p>
          <p><span class="info">ℹ</span> Submitting to Edge Addons…</p>
          <p><span class="ok">✔</span> Published 1.0.0</p>
        </div>
        <div class="statusbar">
          <span class="item">Version <b>1.0.0</b></span>
          <span class="item">Stores <b>3</b></span>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section class="section">
      <header class="head center">
        <div class="eyebrow">Everything included</div>
        <h2>Everything you need to ship</h2>
        <p>Batteries included, without getting in your way.</p>
      </header>
      <div class="groups">
        <div v-for="g in groups" :key="g.name" class="group">
          <h3>{{ g.name }}</h3>
          <ul>
            <li v-for="[title, details, d] in g.items" :key="title">
              <span class="icon">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path :d="d" />
                </svg>
              </span>
              <div>
                <h4>{{ title }}</h4>
                <p>{{ details }}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section final">
      <div class="final-card">
        <h2>Start building your extension</h2>
        <div class="cmd"><span class="p">$</span> npm create wxt@latest</div>
        <div class="cta center">
          <a class="btn primary" href="/guide/installation">Get Started</a>
          <a class="btn" href="/examples">See examples</a>
        </div>
      </div>
    </section>
  </div>
</template>

<style>
.VPContent.spike-edf .VPHome {
  padding: 0 !important;
  margin-bottom: 0 !important;
  overflow-x: clip;
}
.VPContent.spike-edf .VPHome::before,
.VPContent.spike-edf .VPHome::after,
.spike-edf.VPContent::before,
.spike-edf.VPContent::after {
  display: none !important;
}
.spike-edf .vp-doc,
.spike-edf .VPHome > div {
  max-width: none;
  padding: 0;
  margin: 0;
}

.edf {
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --w-bg: #fafafa;
  --w-bg-2: #f0f0f1;
  --w-bg-3: #e6e6e8;
  --w-line: #dcdce0;
  --w-fg: #383a42;
  --w-dim: #7c7f8a;
  --w-sel: rgba(11, 138, 0, 0.12);
  --c-kw: #a626a4;
  --c-st: #50a14f;
  --c-fn: #4078f2;
  --c-cm: #a0a1a7;
  --c-pn: #7c7f8a;
  --c-ok: #0b8a00;
  --c-cyan: #0184bc;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  box-sizing: border-box;
  background: var(--vp-c-bg);
  text-align: left;
}
.dark .edf {
  --w-bg: #0b0c0d;
  --w-bg-2: #070808;
  --w-bg-3: #131516;
  --w-line: #1f2224;
  --w-fg: #d4d7dc;
  --w-dim: #7d828a;
  --w-sel: rgba(103, 212, 94, 0.14);
  --c-kw: #c586e0;
  --c-st: #8fcf7e;
  --c-fn: #6fa8ff;
  --c-cm: #5c6370;
  --c-pn: #8b919a;
  --c-ok: #67d45e;
  --c-cyan: #7dd3fc;
  background: #000;
}
.edf :where(h2, h3, h4, p, ul) {
  margin: 0;
  padding: 0;
  border: 0;
}
.edf ul {
  list-style: none !important;
  padding: 0 !important;
}
.edf li {
  margin: 0 !important;
}
.edf code {
  font-family: var(--mono);
}

/* hero */
.edf .hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: 56px 24px 72px;
  background:
    radial-gradient(
      60% 60% at 80% 0%,
      color-mix(in srgb, var(--vp-c-brand-1) 12%, transparent),
      transparent
    ),
    var(--vp-c-bg);
}
.edf .photo {
  display: none;
  position: absolute;
  inset: 0;
  z-index: -1;
}
.dark .edf .hero {
  background: #000;
}
.dark .edf .photo {
  display: block;
  background: var(--art) 90% 30% / cover no-repeat;
  filter: brightness(1.4) contrast(1.1);
}
.dark .edf .photo::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to right, #000 0%, rgba(0, 0, 0, 0.7) 40%, transparent 85%),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.4), transparent 30%, #000 100%);
}
.edf .inner {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 4.4fr) minmax(0, 7.6fr);
  gap: 48px;
  align-items: center;
}
.edf .name {
  margin-top: 8px;
  font: 700 20px var(--mono);
  color: var(--vp-c-brand-1);
}
.edf h1 {
  margin: 8px 0 0;
  padding: 0;
  border: 0;
  font-size: clamp(34px, 4.2vw, 54px);
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-weight: 700;
}
.edf .tagline {
  margin-top: 16px;
  font-size: 18px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}
.edf .cta {
  display: flex;
  gap: 12px;
  margin-top: 28px;
  flex-wrap: wrap;
}
.edf .cta.center {
  justify-content: center;
}
.edf .btn {
  padding: 10px 22px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  font-weight: 600;
  text-decoration: none;
  transition: border-color 0.2s;
}
.edf .btn:hover {
  border-color: var(--vp-c-brand-1);
}
.edf .btn.primary {
  background: var(--vp-c-brand-3, #0b8a00);
  border-color: transparent;
  color: #fff;
}
.edf .btn.primary:hover {
  background: var(--vp-c-brand-2);
}
.dark .edf .btn.primary {
  background: var(--wxt-c-green-1);
  color: #04170a;
}
.dark .edf .btn.primary:hover {
  background: #8ae883;
}

/* sections */
.edf .section {
  max-width: 1152px;
  margin: 0 auto;
  padding: 88px 24px;
  box-sizing: border-box;
}
.edf .section + .section {
  border-top: 1px solid var(--vp-c-divider);
}
.edf .head .eyebrow {
  font: 600 12px/1.4 var(--mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
}
.edf .head h2 {
  margin: 10px 0 0 !important;
  padding: 0 !important;
  border: 0 !important;
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1.15;
  letter-spacing: -0.025em;
  font-weight: 700;
}
.edf .head p {
  max-width: 620px;
  margin-top: 14px;
  font-size: 17px;
  line-height: 1.65;
  color: var(--vp-c-text-2);
}
.edf .head.center {
  text-align: center;
}
.edf .head.center p {
  margin-inline: auto;
}
.edf .head p code,
.edf .head li code {
  font-size: 0.88em;
  padding: 2px 6px;
  border-radius: 5px;
  background: var(--vp-c-bg-soft);
}
.edf .section > .head {
  margin-bottom: 44px;
}
.edf .split {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  gap: 56px;
  align-items: center;
}
.edf .split.flip .head {
  order: 2;
}
.edf .split .head {
  margin: 0 !important;
}
.edf .points {
  margin-top: 22px !important;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.edf .points li {
  position: relative;
  padding-left: 22px !important;
  color: var(--vp-c-text-2);
  line-height: 1.5;
}
.edf .points li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--vp-c-brand-1);
  font-weight: 700;
}
.edf .link {
  display: inline-block;
  margin-top: 20px;
  color: var(--vp-c-brand-1);
  font-weight: 600;
  text-decoration: none;
}
.edf .link:hover {
  text-decoration: underline;
}

/* window */
.edf .win {
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--w-line);
  border-radius: 12px;
  overflow: hidden;
  background: var(--w-bg);
  color: var(--w-fg);
  box-shadow: 0 40px 90px -30px rgba(0, 0, 0, 0.45);
  font-size: 12.5px;
}
.edf .titlebar {
  position: relative;
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 14px;
  background: var(--w-bg-2);
  border-bottom: 1px solid var(--w-line);
}
.edf .lights {
  display: flex;
  gap: 7px;
}
.edf .lights i {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--w-dim);
  opacity: 0.4;
}
.edf .title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: var(--w-dim);
  white-space: nowrap;
}
.edf .body {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  min-height: 420px;
}
.edf .body.three {
  grid-template-columns: 190px minmax(0, 1fr) minmax(0, 1fr);
  min-height: 300px;
}
.edf .body.two-col {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  min-height: 260px;
}
.edf .pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.edf .pane.right {
  border-left: 1px solid var(--w-line);
}
.edf .tree {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  background: var(--w-bg-2);
  border-right: 1px solid var(--w-line);
}
.edf .node {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 3px 10px;
  color: var(--w-dim);
  white-space: nowrap;
}
.edf .node.dir {
  color: var(--w-fg);
}
.edf .node.link {
  cursor: pointer;
  color: var(--w-fg);
}
.edf .node.link:hover {
  background: var(--w-bg-3);
}
.edf .node.on {
  background: var(--w-sel) !important;
}
.edf .node:focus-visible {
  outline: 1px solid var(--vp-c-brand-1);
  outline-offset: -1px;
}
.edf .chev {
  display: inline-block;
  width: 12px;
  margin-right: 2px;
  color: var(--w-dim);
}
.edf .main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.edf .tabbar {
  display: flex;
  height: 32px;
  background: var(--w-bg-2);
  border-bottom: 1px solid var(--w-line);
}
.edf .tab {
  display: flex;
  align-items: center;
  padding: 0 16px;
  color: var(--w-dim);
  white-space: nowrap;
}
.edf .tab.on {
  color: var(--w-fg);
  background: var(--w-bg);
  border-right: 1px solid var(--w-line);
  box-shadow: inset 0 -1px 0 var(--w-bg);
}
.edf .code {
  flex: 1;
  margin: 0;
  padding: 14px 0;
  overflow: hidden;
  font: 13px/1.7 var(--mono);
  background: transparent !important;
}
.edf .code code {
  display: block;
  font: inherit;
  background: none;
  color: inherit;
  padding: 0;
}
.edf .ln {
  display: block;
  white-space: pre;
  padding-right: 16px;
}
.edf .num {
  display: inline-block;
  width: 44px;
  padding-right: 16px;
  text-align: right;
  color: var(--w-dim);
  opacity: 0.55;
  user-select: none;
}
.edf .kw {
  color: var(--c-kw);
}
.edf .st {
  color: var(--c-st);
}
.edf .fn {
  color: var(--c-fn);
}
.edf .cm {
  color: var(--c-cm);
  font-style: italic;
}
.edf .pn {
  color: var(--c-pn);
}
.edf .dock {
  border-top: 1px solid var(--w-line);
  background: var(--w-bg-2);
}
.edf .dock-head {
  padding: 6px 14px;
  color: var(--w-dim);
  border-bottom: 1px solid var(--w-line);
  font-size: 11.5px;
}
.edf .term {
  padding: 10px 14px 12px;
  font: 12.5px/1.7 var(--mono);
  overflow: hidden;
}
.edf .term.big {
  padding: 16px 18px;
  flex: 1;
  background: var(--w-bg);
}
.edf .term p {
  margin: 0 !important;
  white-space: nowrap;
}
.edf .term .gap {
  margin-top: 10px !important;
}
.edf .term .p {
  color: var(--c-ok);
  margin-right: 8px;
}
.edf .term .dim {
  color: var(--w-dim);
}
.edf .term .dim b {
  color: var(--w-fg);
}
.edf .term .ok {
  color: var(--c-ok);
}
.edf .term .info,
.edf .term .cyan {
  color: var(--c-cyan);
}
.edf .term .grn {
  color: var(--c-ok);
}
.edf .term .sz {
  margin-left: 16px;
}
.edf .statusbar {
  display: flex;
  align-items: center;
  gap: 18px;
  height: 26px;
  padding: 0 14px;
  background: var(--w-bg-2);
  border-top: 1px solid var(--w-line);
  color: var(--w-dim);
  font-size: 11.5px;
  white-space: nowrap;
  overflow: hidden;
}
.edf .statusbar b {
  color: var(--w-fg);
  font-weight: 500;
  margin-left: 4px;
}
.edf .statusbar .right {
  margin-left: auto;
}

/* browser tabs */
.edf .tabs {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin: -12px auto 28px;
  padding: 4px;
  width: fit-content;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
}
.edf .tabs button {
  all: unset;
  cursor: pointer;
  padding: 7px 18px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}
.edf .tabs button:hover {
  color: var(--vp-c-text-1);
}
.edf .tabs button.on {
  background: var(--vp-c-brand-3, #0b8a00);
  color: #fff;
}
.dark .edf .tabs button.on {
  background: var(--wxt-c-green-1);
  color: #04170a;
}
.edf .tabs button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
}

/* features */
.edf .groups {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}
.edf .group {
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--wxt-c-bg-panel, var(--vp-c-bg-soft));
  overflow: hidden;
}
.edf .group h3 {
  padding: 18px 22px;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
  border-bottom: 1px solid var(--vp-c-divider);
}
.edf .group li {
  display: flex;
  gap: 14px;
  padding: 18px 22px;
}
.edf .group li + li {
  border-top: 1px solid var(--vp-c-divider);
}
.edf .icon {
  flex: none;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}
.edf .group h4 {
  font-size: 15px;
  font-weight: 600;
}
.edf .group li p {
  margin-top: 4px;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

/* final */
.edf .final {
  padding-bottom: 120px;
}
.edf .final-card {
  padding: 72px 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  text-align: center;
  background:
    radial-gradient(
      60% 90% at 50% 120%,
      color-mix(in srgb, var(--vp-c-brand-1) 22%, transparent),
      transparent
    ),
    var(--wxt-c-bg-panel, var(--vp-c-bg-soft));
}
.edf .final-card h2 {
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  font-size: clamp(28px, 4vw, 40px);
  letter-spacing: -0.025em;
}
.edf .cmd {
  display: inline-block;
  margin-top: 26px;
  padding: 11px 18px;
  border: 1px solid var(--w-line);
  border-radius: 8px;
  background: var(--w-bg);
  color: var(--w-fg);
  font: 14px var(--mono);
}
.edf .cmd .p {
  color: var(--c-ok);
  margin-right: 6px;
}

@media (max-width: 960px) {
  .edf .inner,
  .edf .split {
    grid-template-columns: minmax(0, 1fr);
  }
  .edf .split.flip .head {
    order: 0;
  }
  .edf .groups {
    grid-template-columns: minmax(0, 1fr);
  }
  .edf .body.three {
    grid-template-columns: 160px minmax(0, 1fr);
  }
  .edf .body.three .pane.right {
    grid-column: 1 / -1;
    border-left: 0;
    border-top: 1px solid var(--w-line);
  }
}
@media (max-width: 640px) {
  .edf .hero {
    padding: 40px 16px 48px;
  }
  .edf .section {
    padding: 56px 16px;
  }
  .edf .body {
    grid-template-columns: minmax(0, 1fr);
    min-height: 0;
  }
  .edf .body.three {
    grid-template-columns: minmax(0, 1fr);
  }
  .edf .body.two-col {
    grid-template-columns: minmax(0, 1fr);
  }
  .edf .body.two-col .pane.right {
    border-left: 0;
    border-top: 1px solid var(--w-line);
  }
  .edf .tree {
    flex-direction: row;
    flex-wrap: wrap;
    border-right: 0;
    border-bottom: 1px solid var(--w-line);
  }
  .edf .hero .tree {
    display: none;
  }
  .edf .code {
    font-size: 12px;
  }
  .edf .num {
    width: 32px;
    padding-right: 10px;
  }
  .edf .statusbar {
    gap: 12px;
  }
  .edf .statusbar .right {
    display: none;
  }
  .edf .tabs button {
    padding: 7px 12px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .edf .btn {
    transition: none;
  }
}
</style>
