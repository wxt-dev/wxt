<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import art from '../../../assets/art002e009298.jpg';
import { stats } from './stats';

/**
 * The photo is 1920x1280 and the moon is a circle in it. Everything in the SVG
 * uses the photo's coordinates, so the rings stay lined up with the moon at any
 * viewport size.
 */
const MOON = { x: 1803, y: 598, r: 646 };
const TILT = -18;

type Sat = { kind: 'dot' | 'station' | 'speck'; at: number };
const rings: {
  rx: number;
  ry: number;
  speed: number;
  reverse: boolean;
  dashed: boolean;
  sats: Sat[];
}[] = [
  {
    rx: 780,
    ry: 235,
    speed: 70,
    reverse: false,
    dashed: false,
    sats: [
      { kind: 'dot', at: 0.5 },
      { kind: 'speck', at: 0.05 },
      { kind: 'speck', at: 0.78 },
    ],
  },
  {
    rx: 930,
    ry: 300,
    speed: 110,
    reverse: true,
    dashed: true,
    sats: [
      { kind: 'dot', at: 0.5 },
      { kind: 'station', at: 0.15 },
      { kind: 'speck', at: 0.7 },
    ],
  },
  {
    rx: 1090,
    ry: 370,
    speed: 170,
    reverse: false,
    dashed: true,
    sats: [
      { kind: 'station', at: 0.4 },
      { kind: 'speck', at: 0.9 },
    ],
  },
];

// [x, y, radius, animation delay] - kept left of the moon.
const stars: [number, number, number, number][] = [
  [700, 120, 1.4, 0],
  [860, 60, 1.1, 1.5],
  [1010, 210, 1.6, 3],
  [780, 330, 1.2, 2],
  [1080, 40, 1.3, 4],
  [930, 470, 1.1, 0.8],
  [1100, 720, 1.5, 2.6],
  [820, 880, 1.2, 3.8],
  [1020, 1010, 1.4, 1.2],
  [720, 1120, 1.1, 4.4],
];

function ellipsePath(rx: number, ry: number, reverse: boolean) {
  const { x, y } = MOON;
  const sweep = reverse ? 0 : 1;
  return `M ${x + rx} ${y} A ${rx} ${ry} 0 1 ${sweep} ${x - rx} ${y} A ${rx} ${ry} 0 1 ${sweep} ${x + rx} ${y}`;
}

const animated = ref(true);
onMounted(() => {
  animated.value = !matchMedia('(prefers-reduced-motion: reduce)').matches;
});

const telemetry = [
  ['HMR', stats.hmr],
  ['BROWSERS', stats.browsers],
  ['MANIFEST', stats.manifest],
  ['BUNDLE', stats.bundle],
];
</script>

<template>
  <section class="hero">
    <svg
      class="art"
      viewBox="0 0 1920 1280"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden="true"
    >
      <defs>
        <!-- Hides anything drawn behind the moon. -->
        <mask
          id="hero-behind-moon"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="1920"
          height="1280"
        >
          <rect width="1920" height="1280" fill="#fff" />
          <circle :cx="MOON.x" :cy="MOON.y" :r="MOON.r" fill="#000" />
        </mask>

        <!-- Halves of the rings, in the rotated ring coordinate space. -->
        <clipPath id="hero-ring-back">
          <rect x="-4000" y="-4000" width="9920" :height="4000 + MOON.y" />
        </clipPath>
        <clipPath id="hero-ring-front">
          <rect x="-4000" :y="MOON.y" width="9920" height="4000" />
        </clipPath>

        <g id="hero-rings">
          <template v-for="(ring, i) in rings" :key="i">
            <ellipse
              :class="ring.dashed ? 'dashed ring' : 'ring'"
              :cx="MOON.x"
              :cy="MOON.y"
              :rx="ring.rx"
              :ry="ring.ry"
            />
            <template v-for="(sat, j) in ring.sats" :key="j">
              <g v-if="animated">
                <g v-if="sat.kind === 'dot'">
                  <circle class="glow" r="14" />
                  <circle class="dot" r="4.5" />
                </g>
                <g v-else-if="sat.kind === 'station'">
                  <rect class="panel" x="-9" y="-2" width="6" height="4" />
                  <rect class="panel" x="3" y="-2" width="6" height="4" />
                  <rect class="body" x="-3" y="-3" width="6" height="6" />
                  <circle class="beacon" cy="-6" r="1.8" />
                </g>
                <circle v-else class="speck" r="2.2" />
                <animateMotion
                  :dur="`${ring.speed}s`"
                  :begin="`${-ring.speed * sat.at}s`"
                  repeatCount="indefinite"
                  :path="ellipsePath(ring.rx, ring.ry, ring.reverse)"
                />
              </g>
              <g
                v-else-if="j === 0 && i < 2"
                :transform="`translate(${MOON.x - ring.rx} ${MOON.y})`"
              >
                <circle class="glow" r="14" />
                <circle class="dot" r="4.5" />
              </g>
            </template>
          </template>
        </g>
      </defs>

      <image
        class="photo"
        :href="art"
        width="1920"
        height="1280"
        preserveAspectRatio="xMaxYMid slice"
      />

      <g v-if="animated">
        <circle
          v-for="([x, y, r, delay], i) in stars"
          :key="i"
          class="star"
          :cx="x"
          :cy="y"
          :r="r"
          :style="{ animationDelay: `${delay}s` }"
        />
        <g transform="translate(1100 90)">
          <line class="comet" x1="0" y1="0" x2="120" y2="-42" />
        </g>
        <g transform="translate(1050 600)">
          <line class="comet second" x1="0" y1="0" x2="90" y2="-32" />
        </g>
      </g>

      <!-- Back of the rings, then the moon, then the front of the rings. -->
      <g mask="url(#hero-behind-moon)">
        <g :transform="`rotate(${TILT} ${MOON.x} ${MOON.y})`">
          <g clip-path="url(#hero-ring-back)">
            <use href="#hero-rings" />
          </g>
        </g>
      </g>
      <g :transform="`rotate(${TILT} ${MOON.x} ${MOON.y})`">
        <g clip-path="url(#hero-ring-front)">
          <use href="#hero-rings" />
        </g>
      </g>
    </svg>
    <div class="shade" aria-hidden="true" />

    <div class="inner">
      <img class="logo" src="/hero-logo.svg" alt="" width="72" height="72" />
      <h1>WXT</h1>
      <p class="headline">Next-Gen Web Extension Framework</p>
      <p class="tagline">
        An open source tool that makes web extension development faster than
        ever before.
      </p>
      <div class="actions">
        <a class="btn primary" href="/guide/installation">Get Started</a>
        <a class="btn" href="/guide/introduction">Learn More</a>
      </div>
    </div>

    <div class="hud" aria-hidden="true">
      <ul>
        <li v-for="[key, value] in telemetry" :key="key">
          <span class="key">{{ key }}</span
          ><span class="value">{{ value }}</span>
        </li>
        <li class="status">WXT-001 · PRE-LAUNCH CHECKS COMPLETE</li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: max(720px, 70vh);
  overflow: hidden;
  isolation: isolate;
  background: #000;
  color: #f4f4f5;
  text-align: left;
}
@media (min-width: 960px) {
  /* Let the photo run behind the transparent navbar in dark mode. */
  .dark .hero {
    margin-top: calc(var(--vp-nav-height) * -1);
    padding-top: var(--vp-nav-height);
  }
}

.art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: -2;
}
.photo {
  filter: brightness(1.5) contrast(1.1);
}
.shade {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    linear-gradient(
      to right,
      #000 0%,
      rgba(0, 0, 0, 0.72) 38%,
      transparent 80%
    ),
    linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.45),
      transparent 25%,
      transparent 60%,
      #000 100%
    );
}

.ring {
  fill: none;
  stroke: rgba(255, 255, 255, 0.3);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.ring.dashed {
  stroke: rgba(103, 212, 94, 0.75);
  stroke-dasharray: 2 8;
  animation: hero-drift 40s linear infinite;
}
.glow {
  fill: rgba(103, 212, 94, 0.22);
}
.dot {
  fill: #67d45e;
}
.speck {
  fill: rgba(255, 255, 255, 0.75);
}
.panel {
  fill: #7dd3fc;
  opacity: 0.85;
}
.body {
  fill: #e4e4e7;
}
.beacon {
  fill: #ff5a5a;
  animation: hero-blink 2.4s ease-in-out infinite;
}
.star {
  fill: #fff;
  opacity: 0.2;
  animation: hero-twinkle 5s ease-in-out infinite;
}
.comet {
  stroke: rgba(255, 255, 255, 0.8);
  stroke-width: 1.5;
  stroke-linecap: round;
  opacity: 0;
  animation: hero-comet 19s linear infinite;
}
.comet.second {
  animation-duration: 27s;
  animation-delay: -9s;
}
@keyframes hero-drift {
  to {
    stroke-dashoffset: -100;
  }
}
@keyframes hero-blink {
  0%,
  80%,
  100% {
    opacity: 0.15;
  }
  90% {
    opacity: 1;
  }
}
@keyframes hero-twinkle {
  50% {
    opacity: 0.85;
  }
}
/* Idle most of the cycle, then streaks across the sky briefly. */
@keyframes hero-comet {
  0%,
  93% {
    opacity: 0;
    transform: translate(0, 0);
  }
  95% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-260px, 90px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ring.dashed,
  .beacon,
  .star,
  .comet {
    animation: none;
  }
}

.inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  max-width: 1152px;
  margin: 0 auto;
  padding: 72px 24px;
  box-sizing: border-box;
}
.logo {
  display: block;
  margin: 0 0 8px;
}
h1 {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: clamp(64px, 12vw, 128px);
  line-height: 1;
  letter-spacing: -0.04em;
  font-weight: 700;
  color: #fff;
}
.headline {
  margin: 12px 0 0;
  font-size: clamp(22px, 3.4vw, 36px);
  line-height: 1.25;
  font-weight: 600;
  color: #fff;
}
.tagline {
  max-width: 520px;
  margin: 16px 0 0;
  font-size: 18px;
  line-height: 1.6;
  color: #d4d4d8;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
}
.btn {
  display: inline-block;
  padding: 11px 24px;
  border-radius: 8px;
  border: 1px solid #52525b;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-weight: 600;
  text-decoration: none;
  backdrop-filter: blur(6px);
  transition:
    border-color 0.2s,
    background 0.2s;
}
.btn:hover {
  border-color: #fff;
  color: #fff;
}
.btn.primary {
  background: #67d45e;
  border-color: #67d45e;
  color: #04170a;
}
.btn.primary:hover {
  background: #8ae883;
  border-color: #8ae883;
  color: #04170a;
}

.hud {
  border-top: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
}
.hud ul {
  display: flex;
  flex-wrap: wrap;
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 24px;
  list-style: none;
}
.hud li {
  display: flex;
  gap: 10px;
  align-items: baseline;
  margin: 0;
  padding: 14px 24px 14px 0;
  font: 500 12px/1 var(--wxt-home-mono);
  letter-spacing: 0.08em;
}
.key {
  color: #a1a1aa;
}
.value {
  color: #67d45e;
}
.status {
  margin-left: auto !important;
  padding-right: 0 !important;
  color: #71717a;
}

@media (max-width: 640px) {
  .status {
    display: none !important;
  }
}
</style>
