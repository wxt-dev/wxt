<script setup lang="ts">
import PuzzleTiles from './PuzzleTiles.vue';

const PIECE =
  'M20 20H44C44 8 52 4 60 4C68 4 76 8 76 20H100V44C112 44 116 52 116 60C116 68 112 76 100 76V100H76C76 88 68 84 60 84C52 84 44 88 44 100H20V76C32 76 36 68 36 60C36 52 32 44 20 44Z';

const entrypoints = [
  { label: 'Background', sub: 'background.ts' },
  { label: 'Content', sub: 'content.ts' },
  { label: 'Popup', sub: 'popup/' },
  { label: 'Options', sub: 'options/' },
  { label: 'Side Panel', sub: 'sidepanel/' },
  { label: 'DevTools', sub: 'devtools/' },
];

const browsers = [
  { label: 'Chrome', sub: 'chrome-mv3' },
  { label: 'Firefox', sub: 'firefox-mv2' },
  { label: 'Edge', sub: 'edge-mv3' },
  { label: 'Safari', sub: 'safari-mv2' },
];

const groups = [
  {
    name: 'Build',
    items: [
      [
        'File Based Entrypoints',
        'Manifest is generated based on files in the project with inline configuration.',
      ],
      [
        'MV2 and MV3',
        'Build Manifest V2 or V3 extensions for any browser using the same codebase.',
      ],
      [
        'Supported Browsers',
        'WXT will build extensions for Chrome, Firefox, Edge, Safari, and any Chromium based browser.',
      ],
      [
        'Frontend Framework Agnostic',
        'Works with any front-end framework with a Vite plugin.',
      ],
    ],
  },
  {
    name: 'Develop',
    items: [
      [
        'Fast Dev Mode',
        'Lightning fast HMR for UI development and fast reloads for content/background scripts enables faster iterations.',
      ],
      ['Auto-imports', 'Nuxt-like auto-imports to speed up development.'],
      [
        'TypeScript',
        'Create large projects with confidence using TS by default.',
      ],
      [
        'Module System',
        'Reuse build-time and runtime-code across multiple extensions.',
      ],
    ],
  },
  {
    name: 'Ship',
    items: [
      [
        'Automated Publishing',
        'Automatically zip, upload, submit, and publish extensions.',
      ],
      [
        'Bundle Analysis',
        "Tools for analyzing the final extension bundle and minimizing your extension's size.",
      ],
      [
        'Bootstrap a New Project',
        'Get started quickly with several awesome project templates.',
      ],
    ],
  },
];
</script>

<template>
  <div class="pzf">
    <!-- HERO -->
    <section class="hero">
      <div class="grid-bg" aria-hidden="true" />
      <div class="hero-inner">
        <img class="logo" src="/hero-logo.svg" alt="" width="64" height="64" />
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
        <div class="assembly">
          <PuzzleTiles
            :items="entrypoints"
            :desktop-cols="3"
            :mobile-cols="2"
            :active="[2]"
          />
          <p class="caption">
            Drop a file in <code>entrypoints/</code>. WXT snaps it into your
            manifest.
          </p>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section class="section">
      <header class="head center">
        <div class="eyebrow">Everything fits together</div>
        <h2>Every piece, already in place.</h2>
        <p>Batteries included, without getting in your way.</p>
      </header>
      <div class="groups">
        <div v-for="g in groups" :key="g.name" class="group">
          <h3>{{ g.name }}</h3>
          <ul>
            <li v-for="[title, details] in g.items" :key="title">
              <svg class="bullet" viewBox="0 0 120 100" aria-hidden="true">
                <path :d="PIECE" />
              </svg>
              <div>
                <h4>{{ title }}</h4>
                <p>{{ details }}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- BROWSERS -->
    <section class="section split">
      <div class="head">
        <div class="eyebrow">Cross browser</div>
        <h2>One codebase. Every browser.</h2>
        <p>
          Pick a target and WXT handles the manifest version, browser APIs, and
          output. Build for all of them from the same source.
        </p>
        <div class="cmd"><span class="p">$</span> wxt build -b firefox</div>
      </div>
      <div class="visual narrow">
        <PuzzleTiles
          :items="browsers"
          :desktop-cols="2"
          :mobile-cols="2"
          :active="[0]"
        />
      </div>
    </section>

    <!-- MODULES -->
    <section class="section split flip">
      <div class="head">
        <div class="eyebrow">Module system</div>
        <h2>Add a piece. Keep going.</h2>
        <p>
          Modules add framework support, icons, and build steps with a single
          line of config, and you can write your own to share across projects.
        </p>
        <a class="link" href="/guide/essentials/wxt-modules"
          >Learn about modules →</a
        >
      </div>
      <div class="visual">
        <div class="win">
          <div class="titlebar">
            <span class="lights" aria-hidden="true"><i /><i /><i /></span>
            <span class="wtitle">wxt.config.ts</span>
          </div>
          <pre
            class="code"
          ><code><span class="kw">import</span> { <span class="fn">defineConfig</span> } <span class="kw">from</span> <span class="st">'wxt'</span>;

<span class="kw">export default</span> <span class="fn">defineConfig</span>({
  modules: [
    <span class="st">'@wxt-dev/module-vue'</span>,
    <span class="st">'@wxt-dev/auto-icons'</span>,
    <span class="st">'./modules/my-module'</span>,
  ],
});</code></pre>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section final">
      <div class="final-card">
        <img class="logo" src="/hero-logo.svg" alt="" width="56" height="56" />
        <h2>Ready to snap it together?</h2>
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
.VPContent.spike-pzf .VPHome {
  padding: 0 !important;
  margin-bottom: 0 !important;
  overflow-x: clip;
}
.VPContent.spike-pzf .VPHome::before,
.VPContent.spike-pzf .VPHome::after,
.spike-pzf.VPContent::before,
.spike-pzf.VPContent::after {
  display: none !important;
}
.spike-pzf .vp-doc,
.spike-pzf .VPHome > div {
  max-width: none;
  padding: 0;
  margin: 0;
}

.pzf {
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --pz-tile: var(--vp-c-bg-soft);
  --pz-line: var(--vp-c-divider);
  width: 100vw;
  margin-left: calc(50% - 50vw);
  box-sizing: border-box;
  background: var(--vp-c-bg);
  text-align: center;
}
.dark .pzf {
  --pz-tile: #070808;
  --pz-line: #26292b;
  background: #000;
}
.pzf :where(h2, h3, h4, p, ul) {
  margin: 0;
  padding: 0;
  border: 0;
}
.pzf ul {
  list-style: none !important;
  padding: 0 !important;
}
.pzf li {
  margin: 0 !important;
}
.pzf p {
  margin: 0 !important;
}
.pzf code {
  font-family: var(--mono);
}

/* hero */
.pzf .hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: 72px 24px 88px;
}
.pzf .grid-bg {
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image:
    linear-gradient(var(--vp-c-divider) 1px, transparent 1px),
    linear-gradient(90deg, var(--vp-c-divider) 1px, transparent 1px);
  background-size: 80px 80px;
  background-position: center top;
  opacity: 0.55;
  mask-image: radial-gradient(70% 70% at 50% 25%, #000, transparent);
}
.pzf .hero::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: radial-gradient(
    50% 40% at 50% 20%,
    color-mix(in srgb, var(--vp-c-brand-1) 14%, transparent),
    transparent
  );
}
.pzf .hero-inner {
  max-width: 760px;
  margin: 0 auto;
}
.pzf .logo {
  display: block;
  margin: 0 auto;
}
.pzf .name {
  margin-top: 10px !important;
  font: 700 18px var(--mono);
  letter-spacing: 0.3em;
  color: var(--vp-c-brand-1);
}
.pzf h1 {
  margin: 12px 0 0;
  padding: 0;
  border: 0;
  font-size: clamp(36px, 6vw, 64px);
  line-height: 1.08;
  letter-spacing: -0.03em;
  font-weight: 700;
}
.pzf .tagline {
  max-width: 560px;
  margin: 18px auto 0 !important;
  font-size: 19px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}
.pzf .cta {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 30px;
  flex-wrap: wrap;
}
.pzf .btn {
  padding: 10px 24px;
  border-radius: 999px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-weight: 600;
  text-decoration: none;
  transition: border-color 0.2s;
}
.pzf .btn:hover {
  border-color: var(--vp-c-brand-1);
}
.pzf .btn.primary {
  background: var(--vp-c-brand-3, #0b8a00);
  border-color: transparent;
  color: #fff;
}
.pzf .btn.primary:hover {
  background: var(--vp-c-brand-2);
}
.dark .pzf .btn.primary {
  background: var(--wxt-c-green-1);
  color: #04170a;
}
.dark .pzf .btn.primary:hover {
  background: #8ae883;
}
.pzf .assembly {
  max-width: 560px;
  margin: 64px auto 0;
}
.pzf .caption {
  margin-top: 22px !important;
  font-size: 14px;
  color: var(--vp-c-text-2);
}
.pzf .caption code,
.pzf .head p code {
  font-size: 0.88em;
  padding: 2px 6px;
  border-radius: 5px;
  background: var(--vp-c-bg-soft);
}

/* sections */
.pzf .section {
  max-width: 1152px;
  margin: 0 auto;
  padding: 88px 24px;
  box-sizing: border-box;
}
.pzf .section + .section {
  border-top: 1px solid var(--vp-c-divider);
}
.pzf .head {
  text-align: left;
}
.pzf .head.center {
  text-align: center;
  margin-bottom: 48px;
}
.pzf .eyebrow {
  font: 600 12px/1.4 var(--mono);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
}
.pzf .head h2 {
  margin: 10px 0 0 !important;
  padding: 0 !important;
  border: 0 !important;
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1.15;
  letter-spacing: -0.025em;
  font-weight: 700;
}
.pzf .head p {
  max-width: 520px;
  margin-top: 14px !important;
  font-size: 17px;
  line-height: 1.65;
  color: var(--vp-c-text-2);
}
.pzf .head.center p {
  margin-inline: auto !important;
}
.pzf .link {
  display: inline-block;
  margin-top: 20px;
  color: var(--vp-c-brand-1);
  font-weight: 600;
  text-decoration: none;
}
.pzf .link:hover {
  text-decoration: underline;
}
.pzf .split {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  gap: 64px;
  align-items: center;
}
.pzf .split.flip .head {
  order: 2;
}
.pzf .visual.narrow {
  max-width: 400px;
  width: 100%;
  margin-inline: auto;
}
.pzf .cmd {
  display: inline-block;
  margin-top: 24px;
  padding: 10px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  font: 14px var(--mono);
  color: var(--vp-c-text-1);
}
.pzf .cmd .p {
  color: var(--vp-c-brand-1);
  margin-right: 6px;
}

/* features */
.pzf .groups {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  text-align: left;
}
.pzf .group {
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--wxt-c-bg-panel, var(--vp-c-bg-soft));
  overflow: hidden;
}
.pzf .group h3 {
  padding: 18px 22px;
  font: 600 13px var(--mono);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
  border-bottom: 1px solid var(--vp-c-divider);
}
.pzf .group li {
  display: flex;
  gap: 14px;
  padding: 18px 22px;
}
.pzf .group li + li {
  border-top: 1px solid var(--vp-c-divider);
}
.pzf .bullet {
  flex: none;
  width: 30px;
  height: 25px;
  margin-top: 1px;
  overflow: visible;
  fill: var(--vp-c-brand-soft);
  stroke: var(--vp-c-brand-1);
  stroke-width: 6;
  stroke-linejoin: round;
}
.pzf .group h4 {
  font-size: 15px;
  font-weight: 600;
}
.pzf .group li p {
  margin-top: 4px !important;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

/* code window */
.pzf .win {
  overflow: hidden;
  border: 1px solid var(--pz-line);
  border-radius: 12px;
  background: var(--pz-tile);
  text-align: left;
  box-shadow: 0 30px 70px -30px rgba(0, 0, 0, 0.4);
}
.pzf .titlebar {
  position: relative;
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 14px;
  border-bottom: 1px solid var(--pz-line);
  background: color-mix(in srgb, var(--pz-tile) 85%, var(--vp-c-text-3));
}
.pzf .lights {
  display: flex;
  gap: 7px;
}
.pzf .lights i {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--vp-c-text-3);
  opacity: 0.45;
}
.pzf .wtitle {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12.5px;
  color: var(--vp-c-text-2);
}
.pzf .code {
  margin: 0;
  padding: 18px 20px;
  overflow-x: auto;
  font: 13px/1.75 var(--mono);
  background: transparent !important;
  color: var(--vp-c-text-1);
}
.pzf .code code {
  font: inherit;
  background: none;
  padding: 0;
  color: inherit;
}
.pzf .kw {
  color: #a626a4;
}
.pzf .st {
  color: #50a14f;
}
.pzf .fn {
  color: #4078f2;
}
.dark .pzf .kw {
  color: #c586e0;
}
.dark .pzf .st {
  color: #8fcf7e;
}
.dark .pzf .fn {
  color: #6fa8ff;
}

/* final */
.pzf .final {
  padding-bottom: 120px;
}
.pzf .final-card {
  position: relative;
  padding: 64px 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  overflow: hidden;
  background:
    radial-gradient(
      60% 90% at 50% 120%,
      color-mix(in srgb, var(--vp-c-brand-1) 22%, transparent),
      transparent
    ),
    var(--wxt-c-bg-panel, var(--vp-c-bg-soft));
}
.pzf .final-card h2 {
  margin: 20px 0 0 !important;
  padding: 0 !important;
  border: 0 !important;
  font-size: clamp(28px, 4vw, 40px);
  letter-spacing: -0.025em;
}

@media (max-width: 960px) {
  .pzf .groups {
    grid-template-columns: minmax(0, 1fr);
  }
  .pzf .split {
    grid-template-columns: minmax(0, 1fr);
    gap: 40px;
  }
  .pzf .split.flip .head {
    order: 0;
  }
}
@media (max-width: 640px) {
  .pzf .hero {
    padding: 48px 20px 56px;
  }
  .pzf .assembly {
    margin-top: 44px;
    max-width: 340px;
  }
  .pzf .section {
    padding: 56px 20px;
  }
  .pzf .tagline {
    font-size: 17px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .pzf .btn {
    transition: none;
  }
}
</style>
