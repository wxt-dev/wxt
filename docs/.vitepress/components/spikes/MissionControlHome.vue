<script setup lang="ts">
import art from '../../../assets/art002e009298.jpg';

const telemetry = [
  ['T-0', 'LIFTOFF'],
  ['HMR', '12 ms'],
  ['BROWSERS', '3'],
  ['MANIFEST', 'MV3 ✓'],
  ['BUNDLE', '41 KB'],
];

const features = [
  [
    'Supported Browsers',
    'WXT will build extensions for Chrome, Firefox, Edge, Safari, and any Chromium based browser.',
  ],
  [
    'MV2 and MV3',
    'Build Manifest V2 or V3 extensions for any browser using the same codebase.',
  ],
  [
    'Fast Dev Mode',
    'Lightning fast HMR for UI development and fast reloads for content/background scripts enables faster iterations.',
  ],
  [
    'File Based Entrypoints',
    'Manifest is generated based on files in the project with inline configuration.',
  ],
  ['TypeScript', 'Create large projects with confidence using TS by default.'],
  ['Auto-imports', 'Nuxt-like auto-imports to speed up development.'],
  [
    'Automated Publishing',
    'Automatically zip, upload, submit, and publish extensions.',
  ],
  [
    'Frontend Framework Agnostic',
    'Works with any front-end framework with a Vite plugin.',
  ],
  [
    'Module System',
    'Reuse build-time and runtime-code across multiple extensions.',
  ],
  [
    'Bootstrap a New Project',
    'Get started quickly with several awesome project templates.',
  ],
  [
    'Bundle Analysis',
    "Tools for analyzing the final extension bundle and minimizing your extension's size.",
  ],
].map(([title, details], i) => ({
  id: `SYS-${String(i + 1).padStart(2, '0')}`,
  title,
  details,
  status: i % 4 === 2 ? 'NOMINAL' : 'GO',
}));
</script>

<template>
  <div class="mc">
    <section class="mc-hero" :style="{ '--art': `url(${art})` }">
      <div class="mc-photo" />
      <div class="mc-stars" />
      <svg
        class="mc-orbit"
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
      <div class="mc-inner">
        <div class="mc-eyebrow">
          MISSION WXT-001 · <span>PRE-LAUNCH CHECKS COMPLETE</span>
        </div>
        <img
          class="mc-logo"
          src="/hero-logo.svg"
          alt=""
          width="84"
          height="84"
        />
        <h1>WXT</h1>
        <p class="mc-head">Next-gen Web Extension Framework</p>
        <p class="mc-tag">
          An open source tool that makes web extension development faster than
          ever before.
        </p>
        <div class="mc-cta">
          <a class="mc-btn primary" href="/guide/installation">Get Started</a>
          <a class="mc-btn" href="/guide/introduction">Learn More</a>
        </div>
      </div>
      <ul class="mc-hud" aria-label="Decorative telemetry">
        <li v-for="[k, v] in telemetry" :key="k">
          <span class="k">{{ k }}</span><span class="v">{{ v }}</span>
        </li>
      </ul>
    </section>

    <section class="mc-systems">
      <header>
        <div class="mc-eyebrow">
          FLIGHT READINESS · {{ features.length }} SYSTEMS
        </div>
        <h2>All systems go.</h2>
      </header>
      <div class="mc-grid">
        <article v-for="f in features" :key="f.id" class="mc-card">
          <div class="row">
            <span class="id">{{ f.id }}</span>
            <span class="chip" :class="f.status.toLowerCase()"
              ><i />{{ f.status }}</span
            >
          </div>
          <h3>{{ f.title }}</h3>
          <p>{{ f.details }}</p>
        </article>
      </div>
      <div class="mc-final">
        <span class="mc-eyebrow">T-0</span>
        <a class="mc-btn primary" href="/guide/installation"
          >Launch your extension</a
        >
      </div>
    </section>
  </div>
</template>

<style>
.VPContent.spike-mission-control .VPHome::before,
.VPContent.spike-mission-control .VPHome::after {
  display: none !important;
}
.VPContent.spike-mission-control {
  overflow-x: clip;
}
.VPContent.spike-mission-control .VPHome {
  padding: 0 !important;
  margin-bottom: 0 !important;
}
.VPContent.spike-mission-control .vp-doc,
.VPContent.spike-mission-control .VPHome > div {
  max-width: none;
  padding: 0;
  margin: 0;
}

.mc {
  --mc-green: #67d45e;
  --mc-dim: #a1a1aa;
  --mc-mono: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  background: #000;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  color: #f4f4f5;
  text-align: left;
}
.mc-hero {
  position: relative;
  min-height: 680px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  isolation: isolate;
}
.mc-photo {
  position: absolute;
  inset: 0;
  z-index: -3;
  background: var(--art) 85% center / cover no-repeat;
  opacity: 1;
  filter: brightness(1.5) contrast(1.1);
}
.mc-photo::after {
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
.mc-stars {
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
  animation: mc-twinkle 6s ease-in-out infinite alternate;
}
@keyframes mc-twinkle {
  to {
    opacity: 0.2;
  }
}
.mc-orbit {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  fill: none;
  stroke: rgba(255, 255, 255, 0.28);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.mc-orbit ellipse,
.mc-orbit path {
  vector-effect: non-scaling-stroke;
}
.mc-orbit .d {
  stroke-dasharray: 3 7;
  stroke: rgba(103, 212, 94, 0.5);
}
.mc-orbit .dot {
  fill: var(--mc-green);
  stroke: none;
  animation: mc-pulse 2.4s ease-in-out infinite;
}
@keyframes mc-pulse {
  50% {
    opacity: 0.25;
  }
}

.mc-inner {
  max-width: 1152px;
  width: 100%;
  margin: 0 auto;
  padding: 96px 24px 72px;
  box-sizing: border-box;
}
.mc-eyebrow {
  font: 500 12px/1.4 var(--mc-mono);
  letter-spacing: 0.14em;
  color: var(--mc-dim);
}
.mc-eyebrow span {
  color: var(--mc-green);
}
.mc-logo {
  display: block;
  margin: 28px 0 8px;
}
.mc h1 {
  margin: 0;
  font-size: clamp(64px, 12vw, 128px);
  line-height: 1;
  letter-spacing: -0.04em;
  font-weight: 700;
  color: #fff;
}
.mc-head {
  margin: 12px 0 0;
  font-size: clamp(22px, 3.4vw, 36px);
  font-weight: 600;
  color: #fff;
}
.mc-tag {
  max-width: 520px;
  margin: 16px 0 0;
  font-size: 18px;
  line-height: 1.6;
  color: #d4d4d8;
}
.mc-cta,
.mc-final {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.mc-cta {
  margin-top: 32px;
}
.mc-btn {
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
.mc-btn:hover {
  border-color: #fff;
}
.mc-btn.primary {
  background: var(--mc-green);
  border-color: var(--mc-green);
  color: #04170a !important;
}
.mc-btn.primary:hover {
  background: #8ae883;
}

.mc-hud {
  position: relative;
  margin-top: auto !important;
  display: flex;
  flex-wrap: wrap;
  padding: 0 max(24px, calc((100vw - 1152px) / 2 + 24px)) !important;
  list-style: none;
  border-top: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
}
.mc-hud li {
  display: flex;
  gap: 10px;
  align-items: baseline;
  padding: 14px 24px 14px 0;
  margin-right: 24px;
  font: 500 12px/1 var(--mc-mono);
  letter-spacing: 0.08em;
}
.mc-hud .k {
  color: var(--mc-dim);
}
.mc-hud .v {
  color: var(--mc-green);
}

.mc-systems {
  max-width: 1152px;
  margin: 0 auto;
  padding: 72px 24px 96px;
  box-sizing: border-box;
}
.mc-systems h2 {
  margin: 6px 0 32px;
  padding: 0;
  border: 0;
  line-height: 1.2;
  font-size: 36px;
  letter-spacing: -0.02em;
  color: #fff;
}
.mc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.mc-card {
  padding: 20px;
  border: 1px solid #262626;
  border-radius: 10px;
  background: #060606;
  transition:
    border-color 0.2s,
    transform 0.2s;
}
.mc-card:hover {
  border-color: rgba(103, 212, 94, 0.6);
  transform: translateY(-2px);
}
.mc-card .row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mc-card .id {
  font: 500 12px var(--mc-mono);
  letter-spacing: 0.1em;
  color: var(--mc-dim);
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border: 1px solid rgba(103, 212, 94, 0.45);
  border-radius: 99px;
  font: 600 11px var(--mc-mono);
  letter-spacing: 0.1em;
  color: var(--mc-green);
}
.chip i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.chip.nominal {
  color: #7dd3fc;
  border-color: rgba(125, 211, 252, 0.45);
}
.mc-card h3 {
  margin: 16px 0 6px;
  font-size: 17px;
  font-weight: 600;
  color: #fff;
}
.mc-card p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #b4b4bc;
}
.mc-final {
  align-items: center;
  margin-top: 56px;
  justify-content: center;
}

@media (max-width: 640px) {
  .mc-inner {
    padding: 64px 20px 48px;
  }
  .mc-hud li {
    margin-right: 0;
    padding-right: 16px;
  }
  .mc-hud {
    padding: 0 20px;
  }
  .mc-photo {
    background-position: 70% center;
    opacity: 0.55;
  }
}
@media (prefers-reduced-motion: reduce) {
  .mc-stars,
  .mc-orbit .dot {
    animation: none;
  }
  .mc-card {
    transition: none;
  }
}
</style>
