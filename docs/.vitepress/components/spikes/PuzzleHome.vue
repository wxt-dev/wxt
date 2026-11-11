<script setup lang="ts">
const PIECE =
  'M20 20H44C44 8 52 4 60 4C68 4 76 8 76 20H100V44C112 44 116 52 116 60C116 68 112 76 100 76V100H76C76 88 68 84 60 84C52 84 44 88 44 100H20V76C32 76 36 68 36 60C36 52 32 44 20 44Z';

// Each piece: position, size, rotation, start offset, delay
const pieces = [
  {
    x: '2%',
    y: '6%',
    s: 150,
    r: -14,
    dx: '-120px',
    dy: '-60px',
    d: 0,
    f: true,
  },
  { x: '80%', y: '2%', s: 190, r: 18, dx: '140px', dy: '-80px', d: 0.12 },
  { x: '-3%', y: '58%', s: 210, r: 32, dx: '-140px', dy: '80px', d: 0.24 },
  {
    x: '86%',
    y: '56%',
    s: 150,
    r: -24,
    dx: '120px',
    dy: '90px',
    d: 0.36,
    f: true,
  },
  { x: '22%', y: '70%', s: 100, r: 70, dx: '-60px', dy: '120px', d: 0.48 },
  { x: '68%', y: '72%', s: 120, r: -50, dx: '60px', dy: '120px', d: 0.6 },
];

// r = peg on right edge, b = peg on bottom edge
const features = [
  {
    title: 'Supported Browsers',
    details:
      'WXT will build extensions for Chrome, Firefox, Edge, Safari, and any Chromium based browser.',
    r: true,
    b: true,
  },
  {
    title: 'MV2 and MV3',
    details:
      'Build Manifest V2 or V3 extensions for any browser using the same codebase.',
    r: true,
    b: true,
  },
  {
    title: 'Fast Dev Mode',
    details:
      'Lightning fast HMR for UI development and fast reloads for content/background scripts enables faster iterations.',
    b: true,
  },
  {
    title: 'File Based Entrypoints',
    details:
      'Manifest is generated based on files in the project with inline configuration.',
    r: true,
    b: true,
  },
  {
    title: 'TypeScript',
    details: 'Create large projects with confidence using TS by default.',
    r: true,
    b: true,
  },
  {
    title: 'Auto-imports',
    details: 'Nuxt-like auto-imports to speed up development.',
    b: true,
  },
  {
    title: 'Automated Publishing',
    details: 'Automatically zip, upload, submit, and publish extensions.',
    r: true,
    b: true,
  },
  {
    title: 'Frontend Framework Agnostic',
    details: 'Works with any front-end framework with a Vite plugin.',
    r: true,
  },
  {
    title: 'Module System',
    details: 'Reuse build-time and runtime-code across multiple extensions.',
    b: true,
  },
  {
    title: 'Bootstrap a New Project',
    details: 'Get started quickly with several awesome project templates.',
    r: true,
  },
  {
    title: 'Bundle Analysis',
    details:
      "Tools for analyzing the final extension bundle and minimizing your extension's size.",
  },
];
</script>

<template>
  <div class="pz">
    <section class="pz-hero">
      <svg
        v-for="(p, i) in pieces"
        :key="i"
        class="pz-piece"
        :class="{ filled: p.f }"
        viewBox="0 0 120 100"
        aria-hidden="true"
        :style="{
          left: p.x,
          top: p.y,
          width: p.s + 'px',
          '--r': p.r + 'deg',
          '--dx': p.dx,
          '--dy': p.dy,
          '--d': p.d + 's',
        }"
      >
        <path :d="PIECE" />
      </svg>

      <div class="pz-hero-inner">
        <img
          class="pz-logo"
          src="/hero-logo.svg"
          alt=""
          width="72"
          height="72"
        />
        <p class="pz-name">WXT</p>
        <h1>Next-gen Web Extension Framework</h1>
        <p class="pz-tagline">
          An open source tool that makes web extension development faster than
          ever before.
        </p>
        <div class="pz-actions">
          <a class="pz-btn pz-btn-brand" href="/guide/installation"
            >Get Started</a
          >
          <a class="pz-btn pz-btn-alt" href="/guide/introduction">Learn More</a>
        </div>
      </div>
    </section>

    <section class="pz-features">
      <h2 class="pz-kicker">Everything fits together</h2>
      <div class="pz-grid">
        <article
          v-for="(f, i) in features"
          :key="f.title"
          class="pz-card"
          :class="{
            'peg-r': f.r,
            'peg-b': f.b,
            last: i === features.length - 1,
          }"
        >
          <span class="pz-num">{{ String(i + 1).padStart(2, '0') }}</span>
          <h3>{{ f.title }}</h3>
          <p>{{ f.details }}</p>
        </article>
      </div>
    </section>
  </div>
</template>

<style>
/* Break out of the home layout's constrained width and hide the photo bg */
.VPContent.spike-puzzle {
  overflow-x: clip;
}
.VPContent.spike-puzzle .VPHome::before,
.VPContent.spike-puzzle .VPHome::after,
.spike-puzzle .VPHome::before,
.spike-puzzle .VPHome::after {
  display: none !important;
}
.spike-puzzle .VPHome {
  padding-bottom: 0 !important;
  background: var(--vp-c-bg);
}
.spike-puzzle .VPHome .container,
.spike-puzzle .VPHome .vp-doc {
  max-width: none !important;
  padding: 0 !important;
}
.spike-puzzle .VPHome .vp-doc > div,
.spike-puzzle .VPHome .container > div {
  max-width: none;
}
.pz {
  width: 100vw;
  position: relative;
  left: 50%;
  margin-left: -50vw;
  overflow-x: clip;
  --pz-peg: 34px;
}
.pz * {
  box-sizing: border-box;
}

/* Hero */
.pz-hero {
  position: relative;
  min-height: 640px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 96px 24px;
  overflow: hidden;
  background: radial-gradient(
    ellipse 60% 50% at 50% 45%,
    color-mix(in srgb, var(--vp-c-brand-1) 10%, transparent),
    transparent 70%
  );
}
.pz-piece {
  position: absolute;
  overflow: visible;
  fill: none;
  stroke: var(--vp-c-brand-1);
  stroke-width: 1.5;
  stroke-linejoin: round;
  opacity: 0.55;
  transform: rotate(var(--r));
  animation: pz-snap 1.1s cubic-bezier(0.2, 0.9, 0.25, 1.15) var(--d) both;
}
.pz-piece.filled path {
  fill: color-mix(in srgb, var(--vp-c-brand-1) 12%, transparent);
}
@keyframes pz-snap {
  from {
    opacity: 0;
    transform: translate(var(--dx), var(--dy)) rotate(calc(var(--r) + 50deg));
  }
  to {
    opacity: 0.55;
    transform: rotate(var(--r));
  }
}
.pz-hero-inner {
  position: relative;
  z-index: 1;
  max-width: 760px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.pz-logo {
  margin-bottom: 8px;
  animation: pz-pop 0.5s ease 0.6s both;
}
@keyframes pz-pop {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
}
.pz-name {
  margin: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
  letter-spacing: 0.3em;
  color: var(--vp-c-brand-1);
}
.pz-hero h1 {
  margin: 12px 0 0;
  font-size: clamp(34px, 6vw, 62px);
  line-height: 1.08;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-1);
  border: none;
}
.pz-tagline {
  margin: 20px 0 0;
  max-width: 560px;
  font-size: 18px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}
.pz-actions {
  margin-top: 32px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}
.pz-btn {
  display: inline-block;
  padding: 0 24px;
  line-height: 44px;
  border-radius: 22px;
  font-weight: 600;
  font-size: 15px;
  text-decoration: none !important;
  transition:
    background-color 0.2s,
    border-color 0.2s;
}
.pz-btn-brand {
  background: var(--vp-c-brand-1);
  color: #000 !important;
  border: 1px solid var(--vp-c-brand-1);
}
.pz-btn-brand:hover {
  background: var(--vp-c-brand-2);
}
.pz-btn-alt {
  color: var(--vp-c-text-1) !important;
  border: 1px solid var(--wxt-c-card-border, var(--vp-c-divider));
  background: var(--wxt-c-bg-panel, transparent);
}
.pz-btn-alt:hover {
  border-color: var(--vp-c-brand-1);
}
html:not(.dark) .pz-btn-brand {
  color: #fff !important;
}

/* Features: interlocking grid */
.pz-features {
  max-width: 1120px;
  margin: 0 auto;
  padding: 24px 24px 120px;
}
.pz .pz-kicker {
  margin: 0 0 40px;
  border: none;
  padding: 0;
  text-align: center;
  font-size: 14px;
  font-family: var(--vp-font-family-mono);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
}
.pz-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  padding: 0 calc(var(--pz-peg) / 2) calc(var(--pz-peg) / 2) 0;
}
.pz-card {
  grid-column: span 2;
  position: relative;
  min-height: 190px;
  padding: 32px 36px;
  margin: 0 -1px -1px 0;
  background: var(--wxt-c-bg-panel, var(--vp-c-bg-soft));
  border: 1px solid var(--wxt-c-card-border, var(--vp-c-divider));
  transition:
    background-color 0.25s,
    border-color 0.25s;
}
.pz-card:nth-child(n + 10) {
  grid-column: span 3;
}
.pz-card:nth-child(1) {
  border-top-left-radius: 20px;
}
.pz-card:nth-child(3) {
  border-top-right-radius: 20px;
}
.pz-card:nth-child(10) {
  border-bottom-left-radius: 20px;
}
.pz-card:nth-child(11) {
  border-bottom-right-radius: 20px;
}
.pz-card:nth-child(1) {
  z-index: 12;
}
.pz-card:nth-child(2) {
  z-index: 11;
}
.pz-card:nth-child(3) {
  z-index: 10;
}
.pz-card:nth-child(4) {
  z-index: 9;
}
.pz-card:nth-child(5) {
  z-index: 8;
}
.pz-card:nth-child(6) {
  z-index: 7;
}
.pz-card:nth-child(7) {
  z-index: 6;
}
.pz-card:nth-child(8) {
  z-index: 5;
}
.pz-card:nth-child(9) {
  z-index: 4;
}
.pz-card:nth-child(10) {
  z-index: 3;
}
.pz-card:nth-child(11) {
  z-index: 2;
}
.pz-card:hover {
  z-index: 20;
  border-color: var(--vp-c-brand-1);
}
.pz-num {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  color: var(--vp-c-brand-1);
}
.pz-card h3 {
  margin: 10px 0 8px;
  font-size: 19px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--vp-c-text-1);
  letter-spacing: 0;
}
.pz-card p {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}
/* pegs straddle the seams, like jigsaw tabs */
.pz-card.peg-r::after,
.pz-card.peg-b::before {
  content: '';
  position: absolute;
  width: var(--pz-peg);
  height: var(--pz-peg);
  border-radius: 50%;
  background: var(--wxt-c-bg-panel, var(--vp-c-bg-soft));
  border: 1px solid var(--vp-c-brand-1);
  z-index: 2;
  transition:
    transform 0.3s,
    background-color 0.3s;
}
.pz-card.peg-r::after {
  right: calc(var(--pz-peg) / -2 - 1px);
  top: 50%;
  margin-top: calc(var(--pz-peg) / -2);
  box-shadow:
    inset 0 0 0 5px var(--wxt-c-bg-panel, var(--vp-c-bg-soft)),
    inset 0 0 0 20px color-mix(in srgb, var(--vp-c-brand-1) 35%, transparent);
}
.pz-card.peg-b::before {
  bottom: calc(var(--pz-peg) / -2 - 1px);
  left: 50%;
  margin-left: calc(var(--pz-peg) / -2);
  box-shadow:
    inset 0 0 0 5px var(--wxt-c-bg-panel, var(--vp-c-bg-soft)),
    inset 0 0 0 20px color-mix(in srgb, var(--vp-c-brand-1) 35%, transparent);
}
/* Card 8 spans cols 5-6 and sits above card 11; card 8's bottom peg is skipped */
.pz-card:hover.peg-r::after,
.pz-card:hover.peg-b::before {
  background: var(--vp-c-brand-1);
}

/* Cards slide in once */
@media (prefers-reduced-motion: no-preference) {
  .pz-card {
    animation: pz-card-in 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
    animation-delay: calc(var(--i, 0) * 30ms + 0.2s);
  }
  .pz-card:nth-child(odd) {
    --from: -24px;
  }
  .pz-card:nth-child(even) {
    --from: 24px;
  }
  .pz-card:nth-child(1) {
    --i: 1;
  }
  .pz-card:nth-child(2) {
    --i: 2;
  }
  .pz-card:nth-child(3) {
    --i: 3;
  }
  .pz-card:nth-child(4) {
    --i: 4;
  }
  .pz-card:nth-child(5) {
    --i: 5;
  }
  .pz-card:nth-child(6) {
    --i: 6;
  }
  .pz-card:nth-child(7) {
    --i: 7;
  }
  .pz-card:nth-child(8) {
    --i: 8;
  }
  .pz-card:nth-child(9) {
    --i: 9;
  }
  .pz-card:nth-child(10) {
    --i: 10;
  }
  .pz-card:nth-child(11) {
    --i: 11;
  }
}
@keyframes pz-card-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .pz-piece,
  .pz-logo {
    animation: none;
  }
}

@media (max-width: 760px) {
  .pz-hero {
    min-height: 560px;
    padding: 72px 20px;
  }
  .pz-piece {
    opacity: 0.3;
  }
  .pz-grid {
    grid-template-columns: 1fr;
    padding: 0 0 calc(var(--pz-peg) / 2) 0;
  }
  .pz-card,
  .pz-card:nth-child(n + 10) {
    grid-column: auto;
    min-height: 0;
    border-radius: 0;
    padding: 28px 24px;
  }
  .pz-card:nth-child(1) {
    border-radius: 20px 20px 0 0;
  }
  .pz-card.last {
    border-radius: 0 0 20px 20px;
  }
  .pz-card.peg-r::after {
    display: none;
  }
  .pz-card:nth-child(n):not(.last)::before {
    content: '';
    position: absolute;
    width: var(--pz-peg);
    height: var(--pz-peg);
    border-radius: 50%;
    background: var(--wxt-c-bg-panel, var(--vp-c-bg-soft));
    border: 1px solid var(--vp-c-brand-1);
    z-index: 2;
    bottom: calc(var(--pz-peg) / -2 - 1px);
    left: 50%;
    margin-left: calc(var(--pz-peg) / -2);
    box-shadow:
      inset 0 0 0 5px var(--wxt-c-bg-panel, var(--vp-c-bg-soft)),
      inset 0 0 0 20px color-mix(in srgb, var(--vp-c-brand-1) 35%, transparent);
  }
}
</style>
