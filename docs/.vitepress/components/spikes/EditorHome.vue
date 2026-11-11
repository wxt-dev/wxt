<script setup lang="ts">
import { computed, ref } from 'vue';

import art from '../../../assets/art002e009298.jpg';

type Token = { t: string; c?: string };

const sources: Record<string, string> = {
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

const tree = [
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

const active = ref('background.ts');

const KEYWORDS = /^(export|default|import|from|const|let|return)$/;
function tokenize(line: string): Token[] {
  const out: Token[] = [];
  const re =
    /(\/\/.*$)|('[^']*')|([A-Za-z_$][\w$]*)(?=\()|([A-Za-z_$][\w$]*)|(\s+)|(.)/g;
  for (const m of line.matchAll(re)) {
    if (m[1]) out.push({ t: m[1], c: 'cm' });
    else if (m[2]) out.push({ t: m[2], c: 'st' });
    else if (m[3]) out.push({ t: m[3], c: 'fn' });
    else if (m[4])
      out.push({ t: m[4], c: KEYWORDS.test(m[4]) ? 'kw' : undefined });
    else out.push({ t: m[0], c: m[6] ? 'pn' : undefined });
  }
  return out;
}
const lines = computed(() =>
  sources[active.value].split('\n').map((l) => tokenize(l)),
);

const build = [
  ['', 'WXT 0.21.5'],
  ['ok', 'Built background in 38ms'],
  ['ok', 'Built content in 24ms'],
  ['ok', 'Built popup in 112ms'],
  ['ok', 'Built manifest.json (0.9 kB)'],
];

const status = [
  ['Built in', '174 ms'],
  ['Total', '41.3 kB'],
  ['Target', 'chrome-mv3'],
];

const features = [
  [
    'Supported Browsers',
    'WXT will build extensions for Chrome, Firefox, Edge, Safari, and any Chromium based browser.',
    'M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  ],
  [
    'MV2 and MV3',
    'Build Manifest V2 or V3 extensions for any browser using the same codebase.',
    'M7 7h10v10H7zM3 9h4M3 15h4M17 9h4M17 15h4',
  ],
  [
    'Fast Dev Mode',
    'Lightning fast HMR for UI development and fast reloads for content/background scripts enables faster iterations.',
    'M13 2L4 14h7l-1 8 9-12h-7z',
  ],
  [
    'File Based Entrypoints',
    'Manifest is generated based on files in the project with inline configuration.',
    'M4 4h6l2 2h8v14H4z',
  ],
  [
    'TypeScript',
    'Create large projects with confidence using TS by default.',
    'M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14',
  ],
  [
    'Auto-imports',
    'Nuxt-like auto-imports to speed up development.',
    'M12 3v12M7 10l5 5 5-5M4 20h16',
  ],
  [
    'Automated Publishing',
    'Automatically zip, upload, submit, and publish extensions.',
    'M12 21V9M7 14l5-5 5 5M4 4h16',
  ],
  [
    'Frontend Framework Agnostic',
    'Works with any front-end framework with a Vite plugin.',
    'M4 4h16v16H4zM4 9h16M9 9v11',
  ],
  [
    'Module System',
    'Reuse build-time and runtime-code across multiple extensions.',
    'M12 2l9 5v10l-9 5-9-5V7zM12 12l9-5M12 12v10M12 12L3 7',
  ],
  [
    'Bootstrap a New Project',
    'Get started quickly with several awesome project templates.',
    'M12 5v14M5 12h14',
  ],
  [
    'Bundle Analysis',
    "Tools for analyzing the final extension bundle and minimizing your extension's size.",
    'M4 20V10M10 20V4M16 20v-8M22 20H2',
  ],
];
</script>

<template>
  <div class="ed">
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
          aria-label="Mock code editor showing a WXT project and its build output"
        >
          <div class="titlebar">
            <span class="lights" aria-hidden="true"><i /><i /><i /></span>
            <span class="title">my-extension</span>
          </div>
          <div class="body">
            <nav class="tree" aria-label="Project files">
              <button
                v-for="(n, i) in tree"
                :key="i"
                class="node"
                :class="{
                  dir: n.dir,
                  on: n.file && n.file === active,
                  link: n.file,
                }"
                :style="{ paddingLeft: 10 + n.depth * 12 + 'px' }"
                :disabled="!n.file"
                @click="n.file && (active = n.file)"
              >
                <span class="chev" aria-hidden="true">{{
                  n.dir ? '›' : ''
                }}</span
                >{{ n.name }}
              </button>
            </nav>
            <div class="main">
              <div class="tabbar">
                <span class="tab on">{{ active }}</span>
              </div>
              <pre class="code"><code><span
                v-for="(line, i) in lines"
                :key="active + i"
                class="ln"
              ><span class="num">{{ i + 1 }}</span><span
                  v-for="(tok, j) in line"
                  :key="j"
                  :class="tok.c"
                >{{ tok.t }}</span></span></code></pre>
              <div class="dock">
                <div class="dock-head">Terminal</div>
                <div class="term">
                  <p class="cmd">
                    <span class="p">~/my-extension</span> wxt build
                  </p>
                  <p
                    v-for="([k, line], i) in build"
                    :key="i"
                    class="out"
                    :class="k"
                    :style="{ animationDelay: 0.5 + i * 0.35 + 's' }"
                  >
                    <span v-if="k" class="check">✓</span>{{ line }}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div class="statusbar">
            <span v-for="[k, v] in status" :key="k" class="item"
              >{{ k }} <b>{{ v }}</b></span
            >
            <span class="item right">TypeScript</span>
          </div>
        </div>
      </div>
    </section>

    <section class="features">
      <header>
        <h2>Everything you need to ship</h2>
        <p>Batteries included, without getting in your way.</p>
      </header>
      <ul>
        <li v-for="[title, details, d] in features" :key="title" class="card">
          <span class="icon">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path :d="d" />
            </svg>
          </span>
          <h3>{{ title }}</h3>
          <p>{{ details }}</p>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.ed {
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  /* Light fallback palette (One Light-ish) */
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
  width: 100vw;
  margin-left: calc(50% - 50vw);
  box-sizing: border-box;
  background: var(--vp-c-bg);
  text-align: left;
}

/* hero */
.hero {
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
.photo {
  position: absolute;
  inset: 0;
  z-index: -1;
  display: none;
}

.inner {
  max-width: 1280px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 4.4fr) minmax(0, 7.6fr);
  gap: 48px;
  align-items: center;
}
.name {
  margin: 8px 0 0;
  font-family: var(--mono);
  font-weight: 700;
  font-size: 20px;
  color: var(--vp-c-brand-1);
}
h1 {
  margin: 8px 0 0;
  padding: 0;
  border: 0;
  font-size: clamp(34px, 4.2vw, 54px);
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-weight: 700;
}
.tagline {
  margin: 16px 0 0;
  font-size: 18px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}
.cta {
  display: flex;
  gap: 12px;
  margin-top: 28px;
  flex-wrap: wrap;
}
.btn {
  padding: 10px 22px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-1);
  font-weight: 600;
  text-decoration: none;
  transition: border-color 0.2s;
}
.btn:hover {
  border-color: var(--vp-c-brand-1);
}
.btn.primary {
  background: var(--vp-c-brand-3, #0b8a00);
  border-color: transparent;
  color: #fff;
}
.btn.primary:hover {
  background: var(--vp-c-brand-2);
}

/* window */
.win {
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--w-line);
  border-radius: 12px;
  overflow: hidden;
  background: var(--w-bg);
  color: var(--w-fg);
  box-shadow:
    0 40px 90px -30px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.02);
  font-size: 12.5px;
}
.titlebar {
  position: relative;
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 14px;
  background: var(--w-bg-2);
  border-bottom: 1px solid var(--w-line);
}
.lights {
  display: flex;
  gap: 7px;
}
.lights i {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--w-dim);
  opacity: 0.4;
}
.title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  color: var(--w-dim);
}
.body {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  min-height: 420px;
}
.tree {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  background: var(--w-bg-2);
  border-right: 1px solid var(--w-line);
}
.node {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 3px 10px;
  color: var(--w-dim);
  white-space: nowrap;
}
.node.dir {
  color: var(--w-fg);
}
.node.link {
  cursor: pointer;
  color: var(--w-fg);
}
.node.link:hover {
  background: var(--w-bg-3);
}
.node.on {
  background: var(--w-sel) !important;
}
.node:focus-visible {
  outline: 1px solid var(--vp-c-brand-1);
  outline-offset: -1px;
}
.chev {
  display: inline-block;
  width: 12px;
  margin-right: 2px;
  color: var(--w-dim);
}
.main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.tabbar {
  display: flex;
  height: 32px;
  background: var(--w-bg-2);
  border-bottom: 1px solid var(--w-line);
}
.tab {
  display: flex;
  align-items: center;
  padding: 0 16px;
  color: var(--w-dim);
}
.tab.on {
  color: var(--w-fg);
  background: var(--w-bg);
  border-right: 1px solid var(--w-line);
  box-shadow: inset 0 -1px 0 var(--w-bg);
}
.code {
  flex: 1;
  margin: 0;
  padding: 14px 0;
  overflow: hidden;
  font: 13px/1.7 var(--mono);
  background: transparent;
}
.code code {
  display: block;
  font: inherit;
  background: none;
  color: inherit;
  padding: 0;
}
.ln {
  display: block;
  white-space: pre;
  padding-right: 16px;
}
.num {
  display: inline-block;
  width: 44px;
  padding-right: 16px;
  text-align: right;
  color: var(--w-dim);
  opacity: 0.55;
  user-select: none;
}
.kw {
  color: var(--c-kw);
}
.st {
  color: var(--c-st);
}
.fn {
  color: var(--c-fn);
}
.cm {
  color: var(--c-cm);
  font-style: italic;
}
.pn {
  color: var(--c-pn);
}
.dock {
  border-top: 1px solid var(--w-line);
  background: var(--w-bg-2);
}
.dock-head {
  padding: 6px 14px;
  color: var(--w-dim);
  border-bottom: 1px solid var(--w-line);
  font-size: 11.5px;
}
.term {
  padding: 10px 14px 12px;
  font: 12.5px/1.65 var(--mono);
}
.term p {
  margin: 0;
}
.cmd .p {
  color: var(--c-ok);
  margin-right: 8px;
}
.out {
  color: var(--w-dim);
  opacity: 0;
  animation: ed-in 0.3s forwards;
}
.out.ok {
  color: var(--w-fg);
}
.check {
  color: var(--c-ok);
  margin-right: 8px;
}
@keyframes ed-in {
  to {
    opacity: 1;
  }
}
.statusbar {
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
.statusbar b {
  color: var(--w-fg);
  font-weight: 500;
  margin-left: 4px;
}
.statusbar .right {
  margin-left: auto;
}

/* features */
.features {
  max-width: 1152px;
  margin: 0 auto;
  padding: 80px 24px 112px;
}
.features header {
  text-align: center;
  margin-bottom: 44px;
}
.features h2 {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 34px;
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.features header p {
  margin: 10px 0 0;
  color: var(--vp-c-text-2);
  font-size: 17px;
}
.features ul {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.card {
  margin: 0;
  padding: 22px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--wxt-c-bg-panel, var(--vp-c-bg-soft));
  transition: border-color 0.2s;
}
.card:hover {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 55%, transparent);
}
.icon {
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}
.card h3 {
  margin: 16px 0 6px;
  font-size: 17px;
  font-weight: 600;
}
.card p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

@media (max-width: 960px) {
  .inner {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 640px) {
  .hero {
    padding: 40px 16px 48px;
  }
  .body {
    grid-template-columns: minmax(0, 1fr);
    min-height: 0;
  }
  .tree {
    display: none;
  }
  .code {
    font-size: 12px;
  }
  .num {
    width: 32px;
    padding-right: 10px;
  }
  .statusbar {
    gap: 12px;
  }
  .statusbar .item:nth-child(3),
  .statusbar .right {
    display: none;
  }
  .features {
    padding: 56px 16px 72px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .out {
    animation: none;
    opacity: 1;
  }
  .card {
    transition: none;
  }
}
</style>

<style>
.dark .ed {
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
  background: #000;
}
.dark .ed .hero {
  background: #000;
}
.dark .ed .photo {
  display: block;
  background: var(--art) 90% 30% / cover no-repeat;
  filter: brightness(1.4) contrast(1.1);
}
.dark .ed .photo::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to right, #000 0%, rgba(0, 0, 0, 0.7) 40%, transparent 85%),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.4), transparent 30%, #000 100%);
}
.dark .ed .btn.primary {
  background: var(--wxt-c-green-1);
  color: #04170a;
}
.dark .ed .btn.primary:hover {
  background: #8ae883;
}
.VPContent.spike-editor .VPHome {
  padding-bottom: 0 !important;
  overflow-x: clip;
}
.VPContent.spike-editor .VPHome::before,
.VPContent.spike-editor .VPHome::after,
.VPHome:has(.ed)::before,
.VPHome:has(.ed)::after,
.spike-editor.VPContent::before,
.spike-editor.VPContent::after {
  display: none !important;
}
.spike-editor .vp-doc,
.spike-editor .VPHome > div {
  max-width: none;
}
</style>
