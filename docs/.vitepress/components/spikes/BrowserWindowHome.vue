<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const files = [
  { path: 'background.ts', key: 'background', depth: 1 },
  { path: 'content.ts', key: 'content_scripts', depth: 1 },
  { path: 'popup/', key: null, depth: 1, dir: true },
  { path: 'index.html', key: 'action', depth: 2 },
  { path: 'options/', key: null, depth: 1, dir: true },
  { path: 'index.html', key: 'options_ui', depth: 2 },
];

const active = ref('action');
const pinned = ref(false);
const keys = ['background', 'content_scripts', 'action', 'options_ui'];
let timer: ReturnType<typeof setInterval> | undefined;

function hover(key: string | null) {
  if (!key) return;
  pinned.value = true;
  active.value = key;
}
function leave() {
  pinned.value = false;
}

onMounted(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let i = keys.indexOf(active.value);
  timer = setInterval(() => {
    if (pinned.value) return;
    i = (i + 1) % keys.length;
    active.value = keys[i];
  }, 2400);
});
onBeforeUnmount(() => clearInterval(timer));

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
  <div class="bw">
    <section class="hero">
      <div class="copy">
        <img class="logo" src="/hero-logo.svg" alt="" width="56" height="56" />
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
        class="window"
        role="img"
        aria-label="Mock browser window showing a file tree that maps to a generated manifest.json"
      >
        <div class="tabs">
          <span class="dots" aria-hidden="true"><i /><i /><i /></span>
          <span class="tab on"
            ><img src="/logo.svg" alt="" width="12" height="12" />My
            Extension</span
          >
          <span class="tab">New Tab</span>
        </div>
        <div class="bar">
          <span class="nav" aria-hidden="true">‹ › ⟳</span>
          <span class="url">https://example.com</span>
          <span class="ext">
            <span class="puzzle"
              ><img src="/logo.svg" alt="" width="16" height="16"
            /></span>
            <span class="puzzle dim" />
            <span class="puzzle dim" />
          </span>
        </div>
        <div class="page">
          <div class="popup" :class="{ lit: active === 'action' }">
            <div class="popup-head">popup/index.html</div>
            <div class="popup-body">
              <b>Hello WXT</b>
              <span>count is 3</span>
            </div>
          </div>
          <div class="split">
            <div class="tree" @mouseleave="leave">
              <p class="cap">entrypoints/</p>
              <div
                v-for="(f, i) in files"
                :key="i"
                class="file"
                :class="{ on: f.key && f.key === active, dir: f.dir }"
                :style="{ paddingLeft: f.depth * 14 + 'px' }"
                :tabindex="f.key ? 0 : -1"
                @mouseenter="hover(f.key)"
                @focus="hover(f.key)"
                @blur="leave"
              >
                {{ f.path }}
              </div>
            </div>
            <div class="arrow" aria-hidden="true">→</div>
            <pre class="json"><p class="cap">.output/manifest.json</p><code>{
  <span class="k" :class="{ on: active === 'background' }">"background": { "service_worker": "background.js" }</span>,
  <span class="k" :class="{ on: active === 'content_scripts' }">"content_scripts": [{ "js": ["content.js"] }]</span>,
  <span class="k" :class="{ on: active === 'action' }">"action": { "default_popup": "popup.html" }</span>,
  <span class="k" :class="{ on: active === 'options_ui' }">"options_ui": { "page": "options.html" }</span>
}</code></pre>
          </div>
        </div>
      </div>
    </section>

    <section class="features">
      <p class="url-label">
        <span>chrome://extensions</span> · Installed features
      </p>
      <ul>
        <li v-for="[title, details, d] in features" :key="title" class="card">
          <div class="card-head">
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
            <span class="toggle" aria-hidden="true"><i /></span>
          </div>
          <p>{{ details }}</p>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.bw {
  --bw-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  padding: 48px 24px 96px;
  box-sizing: border-box;
  background:
    radial-gradient(
      60% 50% at 70% 0%,
      color-mix(in srgb, var(--vp-c-brand-1) 14%, transparent),
      transparent
    ),
    var(--vp-c-bg);
}
.hero {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  gap: 48px;
  align-items: center;
}
.copy .name {
  margin: 8px 0 0;
  font-family: var(--bw-mono);
  font-weight: 700;
  font-size: 20px;
  color: var(--vp-c-brand-1);
}
h1 {
  margin: 8px 0 0;
  font-size: clamp(34px, 4.4vw, 54px);
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
  border: 1px solid var(--wxt-c-card-border, var(--vp-c-divider));
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
.window {
  border: 1px solid var(--wxt-c-card-border, var(--vp-c-divider));
  border-radius: 12px;
  background: var(--wxt-c-bg-panel, var(--vp-c-bg-soft));
  box-shadow: 0 30px 80px -20px
    color-mix(in srgb, var(--vp-c-brand-1) 25%, transparent);
  overflow: hidden;
  min-width: 0;
}
.tabs {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  padding: 10px 12px 0;
  background: var(--vp-c-bg-alt);
}
.dots {
  display: flex;
  gap: 6px;
  align-self: center;
  margin-right: 10px;
  padding-bottom: 8px;
}
.dots i {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--vp-c-text-3);
  opacity: 0.5;
}
.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  font-size: 12px;
  color: var(--vp-c-text-2);
  border-radius: 8px 8px 0 0;
  white-space: nowrap;
}
.tab.on {
  background: var(--wxt-c-bg-panel, var(--vp-c-bg-soft));
  color: var(--vp-c-text-1);
}
.bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
}
.nav {
  color: var(--vp-c-text-2);
  letter-spacing: 4px;
  font-size: 14px;
}
.url {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 5px 14px;
  border-radius: 999px;
  background: var(--vp-c-bg);
  font-size: 12px;
  color: var(--vp-c-text-2);
}
.ext {
  display: flex;
  gap: 6px;
}
.puzzle {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  border: 1px solid var(--vp-c-brand-1);
}
.puzzle.dim {
  border-color: var(--vp-c-divider);
}
.page {
  position: relative;
  padding: 16px;
}
.popup {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 150px;
  border-radius: 10px;
  border: 1px solid var(--wxt-c-card-border, var(--vp-c-divider));
  background: var(--vp-c-bg);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  font-size: 12px;
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
  z-index: 2;
}
.popup.lit {
  border-color: var(--vp-c-brand-1);
  box-shadow:
    0 0 0 3px color-mix(in srgb, var(--vp-c-brand-1) 25%, transparent),
    0 10px 30px rgba(0, 0, 0, 0.4);
}
.popup-head {
  padding: 6px 10px;
  font-family: var(--bw-mono);
  font-size: 11px;
  color: var(--vp-c-text-2);
  border-bottom: 1px solid var(--vp-c-divider);
}
.popup-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  color: var(--vp-c-text-2);
}
.popup-body b {
  color: var(--vp-c-text-1);
}
.split {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 80px;
  font-family: var(--bw-mono);
  font-size: 12.5px;
}
.cap {
  margin: 0 0 8px;
  font-size: 11px;
  color: var(--vp-c-text-3);
}
.tree {
  flex: none;
  min-width: 140px;
}
.file {
  padding: 3px 8px;
  margin-bottom: 2px;
  border-radius: 6px;
  color: var(--vp-c-text-2);
  border-left: 2px solid transparent;
  transition: all 0.25s;
}
.file.dir {
  color: var(--vp-c-text-3);
}
.file.on {
  color: var(--vp-c-text-1);
  background: color-mix(in srgb, var(--vp-c-brand-1) 14%, transparent);
  border-left-color: var(--vp-c-brand-1);
}
.arrow {
  align-self: center;
  color: var(--vp-c-brand-1);
  font-size: 18px;
}
.json {
  flex: 1;
  min-width: 0;
  margin: 0;
  overflow: hidden;
}
.json code {
  display: block;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.7;
  color: var(--vp-c-text-2);
  background: none;
}
.k {
  display: inline;
  padding: 1px 2px;
  border-radius: 4px;
  transition: all 0.25s;
}
.k.on {
  color: var(--vp-c-text-1);
  background: color-mix(in srgb, var(--vp-c-brand-1) 18%, transparent);
  box-shadow: inset 2px 0 var(--vp-c-brand-1);
}

/* features */
.features {
  max-width: 1200px;
  margin: 96px auto 0;
}
.url-label {
  display: inline-block;
  margin: 0 0 20px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.url-label span {
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  font-family: var(--bw-mono);
}
.features ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.card {
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--wxt-c-card-border, var(--vp-c-divider));
  background: var(--wxt-c-bg-panel, var(--vp-c-bg-soft));
  transition:
    border-color 0.2s,
    transform 0.2s;
}
.card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
}
.card-head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: var(--vp-c-brand-1);
  background: color-mix(in srgb, var(--vp-c-brand-1) 12%, transparent);
  flex: none;
}
.card h3 {
  flex: 1;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  border: 0;
  padding: 0;
  letter-spacing: 0;
}
.toggle {
  width: 30px;
  height: 16px;
  border-radius: 999px;
  background: var(--vp-c-brand-3, #0b8a00);
  position: relative;
  flex: none;
}
.toggle i {
  position: absolute;
  right: 2px;
  top: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
}
.card p {
  margin: 14px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

@media (max-width: 960px) {
  .hero {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 560px) {
  .bw {
    padding: 32px 16px 64px;
  }
  .split {
    flex-direction: column;
  }
  .arrow {
    transform: rotate(90deg);
    align-self: flex-start;
    margin-left: 16px;
  }
  .json {
    width: 100%;
  }
  .nav,
  .tab:not(.on) {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
</style>

<style>
.VPContent.spike-browser-window .VPHome {
  padding-bottom: 0 !important;
  overflow-x: clip;
}
.VPContent.spike-browser-window .VPHome::before,
.VPContent.spike-browser-window .VPHome::after,
.VPHome:has(.bw)::before,
.VPHome:has(.bw)::after,
.spike-browser-window.VPContent::before,
.spike-browser-window.VPContent::after {
  display: none !important;
}
.spike-browser-window .vp-doc,
.spike-browser-window .VPHome > div {
  max-width: none;
}
</style>
