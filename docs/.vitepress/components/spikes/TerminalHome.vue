<script setup lang="ts">
const features = [
  [
    'browsers',
    'Supported Browsers',
    'WXT will build extensions for Chrome, Firefox, Edge, Safari, and any Chromium based browser.',
  ],
  [
    'manifest',
    'MV2 and MV3',
    'Build Manifest V2 or V3 extensions for any browser using the same codebase.',
  ],
  [
    'dev',
    'Fast Dev Mode',
    'Lightning fast HMR for UI development and fast reloads for content/background scripts enables faster iterations.',
  ],
  [
    'entrypoints',
    'File Based Entrypoints',
    'Manifest is generated based on files in the project with inline configuration.',
  ],
  [
    'typescript',
    'TypeScript',
    'Create large projects with confidence using TS by default.',
  ],
  [
    'imports',
    'Auto-imports',
    'Nuxt-like auto-imports to speed up development.',
  ],
  [
    'publish',
    'Automated Publishing',
    'Automatically zip, upload, submit, and publish extensions.',
  ],
  [
    'frameworks',
    'Frontend Framework Agnostic',
    'Works with any front-end framework with a Vite plugin.',
  ],
  [
    'modules',
    'Module System',
    'Reuse build-time and runtime-code across multiple extensions.',
  ],
  [
    'init',
    'Bootstrap a New Project',
    'Get started quickly with several awesome project templates.',
  ],
  [
    'analyze',
    'Bundle Analysis',
    "Tools for analyzing the final extension bundle and minimizing your extension's size.",
  ],
];
</script>

<template>
  <div class="tm">
    <section class="tm-hero">
      <div class="tm-intro">
        <img class="tm-logo" src="/hero-logo.svg" alt="" />
        <h1 class="tm-name">WXT</h1>
        <p class="tm-headline">Next-gen Web Extension Framework</p>
        <p class="tm-tagline">
          An open source tool that makes web extension development faster than
          ever before.
        </p>
        <div class="tm-cta">
          <a class="tm-btn tm-btn-primary" href="/guide/installation"
            >$ Get Started</a
          >
          <a class="tm-btn" href="/guide/introduction">$ Learn More</a>
        </div>
      </div>

      <div
        class="tm-window"
        role="img"
        aria-label="Terminal running wxt dev: entrypoints build, browser launches, content script hot reloads in 12ms"
      >
        <div class="tm-bar">
          <span class="tm-dot"></span><span class="tm-dot"></span
          ><span class="tm-dot"></span>
          <span class="tm-title">~/my-extension — wxt dev</span>
        </div>
        <pre
          class="tm-body"
          aria-hidden="true"
        ><span class="l" style="--i:0"><span class="p">$</span> <span class="b">wxt</span></span>
<span class="l d" style="--i:1">WXT 0.20 <span class="g">Chrome (mv3)</span> with Vite 7</span>
<span class="l" style="--i:2"><span class="ok">✓</span> Built <span class="c">background</span> <span class="d">in 38ms</span></span>
<span class="l" style="--i:3"><span class="ok">✓</span> Built <span class="c">popup</span> <span class="d">in 112ms</span></span>
<span class="l" style="--i:4"><span class="ok">✓</span> Built <span class="c">content</span> <span class="d">in 24ms</span></span>
<span class="l" style="--i:5"><span class="ok">✓</span> Built <span class="c">manifest.json</span> <span class="d">(0.9 kB)</span></span>
<span class="l" style="--i:6"><span class="d">  ┌ .output/chrome-mv3</span></span>
<span class="l" style="--i:7"><span class="d">  ├ background.js    </span>  1.2 kB</span>
<span class="l" style="--i:8"><span class="d">  └ popup.html       </span>  0.5 kB</span>
<span class="l" style="--i:9"><span class="ok">✓</span> Opened browser in <span class="d">412ms</span></span>
<span class="l" style="--i:10"><span class="y">↻</span> Watching for changes…</span>
<span class="l" style="--i:11"><span class="d">  &gt; edit entrypoints/content.ts</span></span>
<span class="l" style="--i:12"><span class="ok">✓</span> reloaded <span class="c">content script</span> in <span class="g">12ms</span></span>
<span class="l" style="--i:13"><span class="p">$</span> <span class="cur"></span></span></pre>
      </div>
    </section>

    <section class="tm-features">
      <div class="tm-window">
        <div class="tm-bar">
          <span class="tm-dot"></span><span class="tm-dot"></span
          ><span class="tm-dot"></span>
          <span class="tm-title">wxt --help</span>
        </div>
        <div class="tm-body tm-help">
          <p><span class="p">$</span> <span class="b">wxt --help</span></p>
          <p class="d">Usage: wxt &lt;feature&gt; [options]</p>
          <p class="d">Features:</p>
          <dl>
            <div v-for="f in features" :key="f[0]" class="tm-row">
              <dt><span class="p">▸</span> {{ f[0] }}</dt>
              <dd>
                <strong>{{ f[1] }}</strong>
                <span class="tm-desc">{{ f[2] }}</span>
              </dd>
            </div>
          </dl>
          <p><span class="p">$</span> <span class="cur"></span></p>
        </div>
      </div>
    </section>
  </div>
</template>

<style>
.VPHome:has(.tm)::before,
.VPHome:has(.tm)::after,
.spike-terminal .VPHome::before,
.spike-terminal .VPHome::after {
  display: none !important;
}
.VPContent:has(.tm) {
  overflow-x: clip;
}
.VPHome:has(.tm) {
  padding-bottom: 0 !important;
}
</style>

<style scoped>
.tm {
  --t-bg: #040704;
  --t-fg: #d6e6d3;
  --t-dim: #8fa38c;
  --t-green: #67d45e;
  --t-cyan: #5fd7d7;
  --t-yellow: #e5c76b;
  --t-line: #1f2e1f;
  font-family:
    ui-monospace, 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  padding: 48px 24px 80px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 56px;
  align-items: center;
}
.tm-hero {
  width: 100%;
  max-width: 1152px;
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  gap: 40px;
  align-items: center;
}
.tm-features {
  width: 100%;
  max-width: 1152px;
}
.tm-logo {
  width: 64px;
  height: 64px;
}
.tm-name {
  font-size: 64px;
  line-height: 1.1;
  font-weight: 700;
  margin: 8px 0 0;
  color: var(--vp-c-brand-1);
  text-shadow: 0 0 18px color-mix(in srgb, var(--vp-c-brand-1) 35%, transparent);
}
.tm-headline {
  font-size: 24px;
  font-weight: 600;
  margin: 8px 0 0;
  color: var(--vp-c-text-1);
}
.tm-headline::before {
  content: '# ';
  color: var(--vp-c-text-2);
}
.tm-tagline {
  margin: 12px 0 0;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}
.tm-cta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 28px;
}
.tm-btn {
  padding: 10px 18px;
  border: 1px solid var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  text-decoration: none;
  border-radius: 4px;
  font-weight: 600;
  transition:
    background 0.15s,
    color 0.15s;
}
.tm-btn:hover,
.tm-btn:focus-visible {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
}
.tm-btn-primary {
  background: var(--vp-c-brand-1);
  color: var(--vp-c-bg);
}
.tm-btn-primary:hover {
  background: transparent;
  color: var(--vp-c-brand-1);
}

.tm-window {
  background: var(--t-bg);
  color: var(--t-fg);
  border: 1px solid var(--t-line);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 40px rgba(103, 212, 94, 0.08);
  min-width: 0;
}
.tm-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--t-line);
  background: #0a110a;
}
.tm-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #2c3a2c;
}
.tm-title {
  margin-left: 8px;
  font-size: 12px;
  color: var(--t-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tm-body {
  position: relative;
  margin: 0;
  padding: 16px 18px;
  font: inherit;
  font-size: 13px;
  line-height: 1.7;
  overflow-x: auto;
  white-space: normal;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 3px,
    rgba(103, 212, 94, 0.03) 3px,
    rgba(103, 212, 94, 0.03) 4px
  );
}
.tm-body :deep(.p),
.p {
  color: var(--t-green);
}
.ok {
  color: var(--t-green);
}
.b {
  color: #fff;
  font-weight: 700;
}
.d {
  color: var(--t-dim);
}
.c {
  color: var(--t-cyan);
}
.g {
  color: var(--t-green);
  text-shadow: 0 0 8px rgba(103, 212, 94, 0.5);
}
.y {
  color: var(--t-yellow);
}
.l {
  display: block;
  white-space: pre;
  opacity: 0;
  animation: tm-line 0.01s forwards;
  animation-delay: calc(var(--i) * 0.12s + 0.1s);
}
@keyframes tm-line {
  to {
    opacity: 1;
  }
}
.cur {
  display: inline-block;
  width: 0.6em;
  height: 1.1em;
  vertical-align: text-bottom;
  background: var(--t-green);
  animation: tm-blink 1.1s steps(1) infinite;
}
@keyframes tm-blink {
  50% {
    opacity: 0;
  }
}

.tm-help {
  white-space: normal;
  font-size: 14px;
}
.tm-help p {
  margin: 0;
}
.tm-help dl {
  margin: 12px 0;
}
.tm-row {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr);
  gap: 16px;
  padding: 10px 0;
  border-top: 1px dashed var(--t-line);
}
.tm-row dt {
  color: var(--t-cyan);
  margin: 0;
}
.tm-row dd {
  margin: 0;
  line-height: 1.6;
}
.tm-row strong {
  display: block;
  color: #fff;
}
.tm-desc {
  color: var(--t-dim);
}

@media (max-width: 900px) {
  .tm-hero {
    grid-template-columns: minmax(0, 1fr);
  }
  .tm-name {
    font-size: 48px;
  }
}
@media (max-width: 600px) {
  .tm {
    padding: 32px 14px 56px;
    gap: 40px;
  }
  .tm-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 2px;
  }
  .tm-body {
    font-size: 12px;
    padding: 12px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .l {
    animation: none;
    opacity: 1;
  }
  .cur {
    animation: none;
  }
}
</style>
