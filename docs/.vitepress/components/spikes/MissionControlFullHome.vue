<script setup lang="ts">
import art from '../../../assets/art002e009298.jpg';

const telemetry = [
  ['T-0', 'LIFTOFF'],
  ['HMR', '12 ms'],
  ['BROWSERS', '4'],
  ['MANIFEST', 'MV2 / MV3'],
  ['BUNDLE', '122 kB'],
];

const stages = [
  {
    t: 'T-3',
    name: 'Create',
    text: 'Bootstrap a project from a template for your favorite framework.',
    cmd: 'npm create wxt@latest',
  },
  {
    t: 'T-2',
    name: 'Develop',
    text: 'Start the dev server. UI hot reloads, scripts restart, and the browser opens with your extension installed.',
    cmd: 'npm run dev',
  },
  {
    t: 'T-1',
    name: 'Ship',
    text: 'Zip it and submit it to every store from one command or a CI job.',
    cmd: 'npm run zip',
  },
];

const files: [string, string, string][] = [
  ['manifest.json', '559 B', 'json'],
  ['popup.html', '301 B', 'html'],
  ['options.html', '408 B', 'html'],
  ['background.js', '10.81 kB', 'js'],
  ['chunks/popup-6b973fdf.js', '80.77 kB', 'js'],
  ['content-scripts/content.js', '10.45 kB', 'js'],
  ['assets/popup-a1f3d880.css', '25 B', 'css'],
  ['icon/128.png', '2.68 kB', 'img'],
];

const status = [
  ['BUILT IN', '959 ms'],
  ['TOTAL', '122.62 kB'],
  ['TARGET', 'chrome-mv3'],
  ['VITE', '7.1'],
];

const groups = [
  {
    n: '01',
    name: 'Build',
    tag: 'Structure your extension',
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
    n: '02',
    name: 'Develop',
    tag: 'Iterate at full speed',
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
    n: '03',
    name: 'Ship',
    tag: 'Get it in front of users',
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

const destinations = [
  ['Chrome', 'chrome-mv3'],
  ['Firefox', 'firefox-mv2'],
  ['Edge', 'edge-mv3'],
  ['Safari', 'safari-mv2'],
];
</script>

<template>
  <div class="mcf">
    <!-- HERO -->
    <section class="hero" :style="{ '--art': `url(${art})` }">
      <div class="photo" />
      <div class="stars" />
      <svg
        class="orbit"
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <ellipse
          cx="900"
          cy="420"
          rx="520"
          ry="170"
          transform="rotate(-18 900 420)"
        />
        <ellipse
          cx="900"
          cy="420"
          rx="380"
          ry="120"
          transform="rotate(-18 900 420)"
          class="d"
        />
        <path d="M120 560 C 400 480, 600 300, 1040 120" class="d" />
        <circle cx="1040" cy="120" r="4" class="dot" />
      </svg>
      <div class="inner">
        <div class="eyebrow">
          MISSION WXT-001 · <span>PRE-LAUNCH CHECKS COMPLETE</span>
        </div>
        <img class="logo" src="/hero-logo.svg" alt="" width="72" height="72" />
        <h1>WXT</h1>
        <p class="head">Next-gen Web Extension Framework</p>
        <p class="tag">
          An open source tool that makes web extension development faster than
          ever before.
        </p>
        <div class="cta">
          <a class="btn primary" href="/guide/installation">Get Started</a>
          <a class="btn" href="/guide/introduction">Learn More</a>
        </div>
      </div>
      <ul class="hud" aria-label="Decorative telemetry">
        <li v-for="[k, v] in telemetry" :key="k">
          <span class="k">{{ k }}</span><span class="v">{{ v }}</span>
        </li>
      </ul>
    </section>

    <!-- LAUNCH SEQUENCE -->
    <section class="section sequence">
      <header>
        <div class="eyebrow">LAUNCH SEQUENCE</div>
        <h2>From zero to the store in three steps.</h2>
      </header>
      <ol class="stages">
        <li v-for="s in stages" :key="s.t" class="stage">
          <div class="marker">
            <span class="t">{{ s.t }}</span>
            <i />
          </div>
          <h3>{{ s.name }}</h3>
          <p>{{ s.text }}</p>
          <code class="cmd"><span class="prompt">$</span> {{ s.cmd }}</code>
        </li>
      </ol>
    </section>

    <!-- TELEMETRY -->
    <section class="section telemetry">
      <div class="telemetry-copy">
        <div class="eyebrow">TELEMETRY</div>
        <h2>Know exactly what you're shipping.</h2>
        <p>
          Every build reports what went into your extension and how big it is.
          Dig deeper with bundle analysis when something looks heavy.
        </p>
        <a class="link" href="/guide/essentials/config/build-mode"
          >Read the build docs →</a
        >
      </div>
      <div class="console" role="img" aria-label="Example wxt build output">
        <div class="console-bar">
          <span class="lights" aria-hidden="true"><i /><i /><i /></span>
          <span class="title">~/my-extension</span>
        </div>
        <div class="console-body">
          <p class="row dim">
            <span>WXT <b>0.21.5</b></span
            ><em>4:08:32 PM</em>
          </p>
          <p class="row">
            <span
              ><span class="info">ℹ</span> Building
              <span class="cyan">chrome-mv3</span> for
              <span class="cyan">production</span> with
              <span class="green">Vite 7.1.0</span></span
            ><em>4:08:32 PM</em>
          </p>
          <p class="row">
            <span><span class="ok">✔</span> Built extension in 959 ms</span
            ><em>4:08:33 PM</em>
          </p>
          <ul class="files">
            <li v-for="[name, size, kind] in files" :key="name">
              <span class="branch">├─</span>
              <span class="dir">.output/chrome-mv3/</span
              ><span class="file" :class="kind">{{ name }}</span>
              <span class="size">{{ size }}</span>
            </li>
          </ul>
          <p class="row">
            <span><span class="cyan">Σ</span> Total size: 122.62 kB</span>
          </p>
          <p class="row">
            <span><span class="ok">✔</span> Finished in 1.043 s</span
            ><em>4:08:33 PM</em>
          </p>
        </div>
        <div class="statusbar">
          <span v-for="[k, v] in status" :key="k" class="item"
            >{{ k }} <b>{{ v }}</b></span
          >
        </div>
      </div>
    </section>

    <!-- SYSTEMS -->
    <section class="section systems">
      <header class="center">
        <div class="eyebrow">MISSION SYSTEMS</div>
        <h2>Everything on board.</h2>
      </header>
      <div class="groups">
        <article v-for="g in groups" :key="g.n" class="group">
          <div class="group-head">
            <span class="num">{{ g.n }}</span>
            <h3>{{ g.name }}</h3>
            <p>{{ g.tag }}</p>
          </div>
          <ul>
            <li v-for="[title, details] in g.items" :key="title">
              <h4>{{ title }}</h4>
              <p>{{ details }}</p>
            </li>
          </ul>
        </article>
      </div>
    </section>

    <!-- DESTINATIONS -->
    <section class="section destinations">
      <header class="center">
        <div class="eyebrow">DESTINATIONS</div>
        <h2>One codebase. Every browser.</h2>
        <p class="sub">
          Pick a target and WXT handles the manifest version, browser APIs, and
          output for you.
        </p>
      </header>
      <ul class="targets">
        <li v-for="[name, target] in destinations" :key="name">
          <span class="dot" />
          <b>{{ name }}</b>
          <code>{{ target }}</code>
        </li>
      </ul>
    </section>

    <!-- FINAL CTA -->
    <section class="section final">
      <div class="final-card">
        <div class="eyebrow">T-0 · <span>READY WHEN YOU ARE</span></div>
        <h2>Launch your extension.</h2>
        <code class="cmd big"
          ><span class="prompt">$</span> npm create wxt@latest</code
        >
        <div class="cta center">
          <a class="btn primary" href="/guide/installation">Get Started</a>
          <a class="btn" href="/examples">See examples</a>
        </div>
      </div>
    </section>
  </div>
</template>

<style>
.VPContent.spike-mcf .VPHome::before,
.VPContent.spike-mcf .VPHome::after {
  display: none !important;
}
.VPContent.spike-mcf {
  overflow-x: clip;
}
.VPContent.spike-mcf .VPHome {
  padding: 0 !important;
  margin-bottom: 0 !important;
}
.VPContent.spike-mcf .vp-doc,
.VPContent.spike-mcf .VPHome > div {
  max-width: none;
  padding: 0;
  margin: 0;
}

.mcf {
  --green: #67d45e;
  --dim: #a1a1aa;
  --line: #1f1f23;
  --panel: #060606;
  --mono: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  background: #000;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  color: #f4f4f5;
  text-align: left;
}
.mcf :where(h2, h3, h4, p, ul, ol) {
  margin: 0;
  padding: 0;
  border: 0;
  list-style: none;
}
.mcf li {
  margin: 0 !important;
}
.mcf ul,
.mcf ol {
  list-style: none !important;
  padding: 0 !important;
}
.mcf .section h2 {
  border: 0 !important;
  padding: 0 !important;
}
.mcf .section h3,
.mcf .section h4 {
  letter-spacing: normal;
}
.mcf .stages,
.mcf .groups,
.mcf .targets {
  margin-top: 48px !important;
}

/* shared */
.mcf .eyebrow {
  font: 500 12px/1.4 var(--mono);
  letter-spacing: 0.14em;
  color: var(--dim);
}
.mcf .eyebrow span {
  color: var(--green);
}
.mcf .section {
  max-width: 1152px;
  margin: 0 auto;
  padding: 88px 24px;
  box-sizing: border-box;
  border-top: 1px solid var(--line);
}
.mcf .section h2 {
  margin-top: 10px;
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1.15;
  letter-spacing: -0.025em;
  font-weight: 700;
  color: #fff;
}
.mcf .center {
  text-align: center;
}
.mcf .btn {
  display: inline-block;
  padding: 11px 24px;
  border-radius: 8px;
  border: 1px solid #52525b;
  background: rgba(0, 0, 0, 0.5);
  color: #fff !important;
  font-weight: 600;
  text-decoration: none !important;
  backdrop-filter: blur(6px);
  transition:
    border-color 0.2s,
    background 0.2s;
}
.mcf .btn:hover {
  border-color: #fff;
}
.mcf .btn.primary {
  background: var(--green);
  border-color: var(--green);
  color: #04170a !important;
}
.mcf .btn.primary:hover {
  background: #8ae883;
}
.mcf .cta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 32px;
}
.mcf .cta.center {
  justify-content: center;
}
.mcf .cmd {
  display: inline-block;
  margin-top: 18px;
  padding: 9px 14px;
  border: 1px solid #27272a;
  border-radius: 8px;
  background: var(--panel);
  font: 13px/1.4 var(--mono);
  color: #e4e4e7;
}
.mcf .prompt {
  color: var(--green);
  margin-right: 6px;
}
.mcf .link {
  display: inline-block;
  margin-top: 20px;
  color: var(--green);
  font-weight: 600;
  text-decoration: none;
}
.mcf .link:hover {
  text-decoration: underline;
}

/* hero */
.hero {
  position: relative;
  min-height: 680px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  isolation: isolate;
}
.photo {
  position: absolute;
  inset: 0;
  z-index: -3;
  background: var(--art) 85% center / cover no-repeat;
  filter: brightness(1.5) contrast(1.1);
}
.photo::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      to right,
      #000 0%,
      rgba(0, 0, 0, 0.75) 35%,
      transparent 80%
    ),
    linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.5),
      transparent 25%,
      transparent 55%,
      #000 100%
    );
}
.stars {
  position: absolute;
  inset: 0;
  z-index: -2;
  background-image:
    radial-gradient(1px 1px at 20px 30px, #fff, transparent),
    radial-gradient(1px 1px at 120px 80px, #ddd, transparent),
    radial-gradient(1.5px 1.5px at 210px 150px, #fff, transparent),
    radial-gradient(1px 1px at 70px 190px, #ccc, transparent),
    radial-gradient(1px 1px at 280px 40px, #fff, transparent);
  background-size: 300px 220px;
  opacity: 0.45;
  mask-image: linear-gradient(to right, #000, transparent 70%);
  animation: mcf-twinkle 6s ease-in-out infinite alternate;
}
@keyframes mcf-twinkle {
  to {
    opacity: 0.2;
  }
}
.orbit {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  fill: none;
  stroke: rgba(255, 255, 255, 0.28);
  stroke-width: 1;
}
.orbit ellipse,
.orbit path {
  vector-effect: non-scaling-stroke;
}
.orbit .d {
  stroke-dasharray: 3 7;
  stroke: rgba(103, 212, 94, 0.5);
}
.orbit .dot {
  fill: var(--green);
  stroke: none;
  animation: mcf-pulse 2.4s ease-in-out infinite;
}
@keyframes mcf-pulse {
  50% {
    opacity: 0.25;
  }
}
.hero .inner {
  max-width: 1152px;
  width: 100%;
  margin: 0 auto;
  padding: 96px 24px 72px;
  box-sizing: border-box;
}
.hero .logo {
  display: block;
  margin: 28px 0 8px;
}
.hero h1 {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: clamp(64px, 12vw, 128px);
  line-height: 1;
  letter-spacing: -0.04em;
  font-weight: 700;
  color: #fff;
}
.hero .head {
  margin-top: 12px;
  font-size: clamp(22px, 3.4vw, 36px);
  font-weight: 600;
  color: #fff;
}
.hero .tag {
  max-width: 520px;
  margin-top: 16px;
  font-size: 18px;
  line-height: 1.6;
  color: #d4d4d8;
}
.hud {
  display: flex;
  flex-wrap: wrap;
  margin-top: auto !important;
  padding: 0 max(24px, calc((100vw - 1152px) / 2 + 24px)) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
}
.hud li {
  display: flex;
  gap: 10px;
  align-items: baseline;
  padding: 14px 24px 14px 0;
  margin-right: 24px;
  font: 500 12px/1 var(--mono);
  letter-spacing: 0.08em;
}
.hud .k {
  color: var(--dim);
}
.hud .v {
  color: var(--green);
}

/* sequence */
.stages {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 32px;
  margin-top: 56px;
}
.stage .marker {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.stage .marker .t {
  font: 600 12px var(--mono);
  letter-spacing: 0.12em;
  color: var(--green);
}
.stage .marker i {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, rgba(103, 212, 94, 0.6), transparent);
}
.stage h3 {
  font-size: 22px;
  font-weight: 600;
  color: #fff;
}
.stage p {
  margin-top: 8px;
  line-height: 1.6;
  color: #b4b4bc;
}

/* telemetry */
.telemetry {
  display: grid;
  grid-template-columns: minmax(0, 4fr) minmax(0, 8fr);
  gap: 56px;
  align-items: center;
}
.telemetry-copy p {
  margin-top: 16px;
  line-height: 1.7;
  color: #b4b4bc;
}
.console {
  min-width: 0;
  border: 1px solid #27272a;
  border-radius: 12px;
  overflow: hidden;
  background: #0b0d10;
  box-shadow: 0 30px 80px -30px rgba(103, 212, 94, 0.18);
}
.console-bar {
  position: relative;
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 14px;
  background: #07080a;
  border-bottom: 1px solid var(--line);
}
.lights {
  display: flex;
  gap: 7px;
}
.lights i {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #52525b;
  opacity: 0.6;
}
.console-bar .title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: var(--dim);
}
.console-body {
  padding: 14px 18px 16px;
  font: 12.5px/1.75 var(--mono);
  color: #d4d7dc;
  overflow-x: auto;
}
.console-body .row {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  white-space: nowrap;
}
.console-body .row em {
  font-style: normal;
  color: #5c6370;
}
.console-body .dim {
  color: #7d828a;
}
.console-body .dim b {
  color: #a1a1aa;
}
.console-body .info,
.console-body .cyan {
  color: #7dd3fc;
}
.console-body .ok,
.console-body .green {
  color: var(--green);
}
.files {
  margin: 2px 0 2px 14px !important;
}
.files li {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}
.files .branch,
.files .dir {
  color: #5c6370;
}
.files .file.json {
  color: #7dd3fc;
}
.files .file.html {
  color: #8fcf7e;
}
.files .file.js {
  color: #bfe9f5;
}
.files .file.css {
  color: #f472b6;
}
.files .file.img {
  color: #93c5fd;
}
.files .size {
  margin-left: auto;
  padding-left: 24px;
  color: #7d828a;
}
.statusbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
  padding: 8px 18px;
  border-top: 1px solid var(--line);
  background: #07080a;
  font: 500 11px var(--mono);
  letter-spacing: 0.08em;
  color: var(--dim);
}
.statusbar b {
  margin-left: 6px;
  font-weight: 600;
  color: var(--green);
}

/* systems */
.mcf .groups {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin-top: 48px;
}
.mcf .group {
  display: flex;
  flex-direction: column;
  border: 1px solid #262626;
  border-radius: 14px;
  background: var(--panel);
  overflow: hidden;
  transition: border-color 0.2s;
}
.mcf .group:hover {
  border-color: rgba(103, 212, 94, 0.5);
}
.mcf .group-head {
  position: relative;
  padding: 24px 24px 20px;
  border-bottom: 1px solid var(--line);
  background: linear-gradient(to bottom, rgba(103, 212, 94, 0.07), transparent);
}
.mcf .group-head .num {
  font: 600 12px var(--mono);
  letter-spacing: 0.12em;
  color: var(--green);
}
.mcf .group-head h3 {
  margin-top: 10px;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #fff;
}
.mcf .group-head p {
  margin-top: 4px;
  font-size: 14px;
  color: var(--dim);
}
.mcf .group ul {
  display: flex;
  flex-direction: column;
}
.mcf .group li {
  padding: 18px 24px;
}
.mcf .group li + li {
  border-top: 1px solid var(--line);
}
.mcf .group h4 {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}
.mcf .group li p {
  margin-top: 4px;
  font-size: 13.5px;
  line-height: 1.6;
  color: #b4b4bc;
}

/* destinations */
.destinations .sub {
  max-width: 520px;
  margin: 14px auto 0;
  line-height: 1.6;
  color: #b4b4bc;
}
.targets {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 48px;
}
.targets li {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 22px;
  border: 1px solid #262626;
  border-radius: 12px;
  background: var(--panel);
}
.targets b {
  font-size: 18px;
  color: #fff;
}
.targets code {
  font: 12px var(--mono);
  color: var(--green);
  background: none;
  padding: 0;
}
.targets .dot {
  position: absolute;
  top: 24px;
  right: 22px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 10px rgba(103, 212, 94, 0.7);
}

/* final */
.final {
  padding-bottom: 120px;
}
.final-card {
  position: relative;
  padding: 72px 24px;
  border: 1px solid #262626;
  border-radius: 20px;
  text-align: center;
  overflow: hidden;
  background:
    radial-gradient(60% 90% at 50% 120%, rgba(103, 212, 94, 0.22), transparent),
    var(--panel);
}
.final-card .cmd.big {
  margin-top: 28px;
  font-size: 15px;
  padding: 12px 18px;
}

@media (max-width: 960px) {
  .stages,
  .groups {
    grid-template-columns: minmax(0, 1fr);
  }
  .telemetry {
    grid-template-columns: minmax(0, 1fr);
    gap: 40px;
  }
  .targets {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .hero .inner {
    padding: 64px 20px 48px;
  }
  .hud {
    padding: 0 20px !important;
  }
  .hud li {
    margin-right: 0;
    padding-right: 16px;
  }
  .photo {
    background-position: 70% center;
    opacity: 0.55;
  }
  .mcf .section {
    padding: 64px 20px;
  }
  .console-body {
    font-size: 11.5px;
  }
  .files .dir {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .stars,
  .orbit .dot {
    animation: none;
  }
  .mcf .group {
    transition: none;
  }
}
</style>
