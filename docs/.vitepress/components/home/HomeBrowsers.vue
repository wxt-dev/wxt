<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import chromeIcon from '../../../assets/i-logos-chrome.svg';
import firefoxIcon from '../../../assets/i-logos-firefox.svg';
import edgeIcon from '../../../assets/i-logos-microsoft-edge.svg';
import safariIcon from '../../../assets/i-logos-safari.svg';
import HomeSectionHead from './HomeSectionHead.vue';

// Cards and the hub have fixed pixel sizes. Only the middle column (where the
// lines are drawn) stretches, so the lines use a stretchable 100 x H viewBox
// and end under the opaque hub at the horizontal center.
const GAP = 48; // Also the container padding (see `--space` in the styles).
const CARD_H = 60;
const LABEL_H = 11;
const ROWS = [0, 1, 2, 3].map(
  (i) => LABEL_H + GAP + CARD_H / 2 + i * (CARD_H + GAP),
);
const H = ROWS[3] + CARD_H / 2;
const HUB_Y = (ROWS[0] + ROWS[3]) / 2;

const sources = [
  { name: 'src/', desc: 'TypeScript source', icon: 'folder' },
  { name: 'entrypoints/', desc: 'Manifest entrypoints', icon: 'entry' },
  { name: 'wxt.config.ts', desc: 'Build configuration', icon: 'config' },
  { name: 'package.json', desc: 'Project metadata', icon: 'package' },
].map((s, i) => ({ ...s, y: ROWS[i] }));

const browsers = [
  { name: 'Chrome', target: 'chrome-mv3', icon: chromeIcon },
  { name: 'Firefox', target: 'firefox-mv2', icon: firefoxIcon },
  { name: 'Safari', target: 'safari-mv2', icon: safariIcon },
  { name: 'Edge', target: 'edge-mv3', icon: edgeIcon },
].map((b, i) => ({ ...b, y: ROWS[i] }));

// Width of the stretchy middle column in px. Lines are drawn in real pixels
// (no viewBox scaling) so `pathLength` based dashes stay in sync across lines.
const linesEl = ref<SVGSVGElement>();
const linesW = ref(400);
onMounted(() => {
  const observer = new ResizeObserver(([entry]) => {
    linesW.value = entry.contentRect.width;
  });
  observer.observe(linesEl.value!);
  return () => observer.disconnect();
});

const inPaths = computed(() => {
  const w = linesW.value;
  return ROWS.map(
    (y) =>
      `M 0 ${y} C ${w * 0.4} ${y}, ${w * 0.25} ${HUB_Y}, ${w / 2} ${HUB_Y}`,
  );
});
const outPaths = computed(() => {
  const w = linesW.value;
  return ROWS.map(
    (y) =>
      `M ${w / 2} ${HUB_Y} C ${w * 0.75} ${HUB_Y}, ${w * 0.6} ${y}, ${w} ${y}`,
  );
});
</script>

<template>
  <section>
    <HomeSectionHead count="03" title="One codebase. Every browser.">
      Write your extension once. WXT takes care of the browser-specific builds.
    </HomeSectionHead>

    <div class="scroller">
      <div class="pad">
        <div class="pipeline" :style="{ height: `${H}px` }">
          <svg class="lines" ref="linesEl" aria-hidden="true">
            <g v-for="(d, i) in [...inPaths, ...outPaths]" :key="i">
              <path class="base" :d="d" pathLength="100" />
              <path
                class="flow"
                :class="i < ROWS.length ? 'in' : 'out'"
                :d="d"
                pathLength="100"
              />
            </g>
          </svg>

          <p class="label" :style="{ left: 0, top: '0%' }">Your project</p>
          <p class="label right" :style="{ right: 0, top: '0%' }">
            Browser builds
          </p>

          <div
            v-for="s in sources"
            :key="s.name"
            class="card"
            :style="{ top: `${s.y}px`, left: 0 }"
          >
            <span class="icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  v-if="s.icon === 'folder'"
                  d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                />
                <path
                  v-else-if="s.icon === 'entry'"
                  d="M10 17l5-5-5-5M15 12H3M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"
                />
                <path
                  v-else-if="s.icon === 'config'"
                  d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M8 14v6"
                />
                <path
                  v-else
                  d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5"
                />
              </svg>
            </span>
            <span class="text">
              <b>{{ s.name }}</b>
              <small>{{ s.desc }}</small>
            </span>
          </div>

          <div class="hub" :style="{ top: `${HUB_Y}px` }">
            <img src="/hero-logo.svg" alt="WXT" />
          </div>

          <div
            v-for="b in browsers"
            :key="b.name"
            class="card"
            :style="{ top: `${b.y}px`, right: 0 }"
          >
            <span class="icon browser-icon">
              <img :src="b.icon" :alt="b.name" />
            </span>
            <span class="text">
              <b>{{ b.name }}</b>
              <small>{{ b.target }}</small>
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.scroller {
  overflow-x: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--wxt-c-bg-panel);
}
.pad {
  --space: 48px;
  --cycle: 5.63s;
  box-sizing: border-box;
  min-width: 760px;
  padding: var(--space);
}
.pipeline {
  --card-w: 200px;
  position: relative;
}

.lines {
  position: absolute;
  top: 0;
  bottom: 0;
  left: var(--card-w);
  right: var(--card-w);
  width: calc(100% - var(--card-w) * 2);
  height: 100%;
  overflow: visible;
}
.lines path {
  fill: none;
  stroke-linecap: round;
}
.base {
  stroke: var(--vp-c-divider);
  stroke-width: 1.5;
}
.flow {
  stroke: var(--wxt-c-green-accent);
  stroke-width: 2;
  /* One pulse travels left -> hub -> right per cycle. */
  stroke-dasharray: 80 132;
  stroke-dashoffset: 80;
  stroke-linecap: butt;

  animation-duration: var(--cycle);
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
.flow.in {
  animation-name: flow-in;
}
.flow.out {
  animation-name: flow-out;
}
@keyframes flow-in {
  0% {
    stroke-dashoffset: 80;
  }
  17.5%,
  100% {
    stroke-dashoffset: -100;
  }
}
@keyframes flow-out {
  0%,
  23% {
    stroke-dashoffset: 80;
  }
  41%,
  100% {
    stroke-dashoffset: -100;
  }
}

.label {
  position: absolute;
  margin: 0;
  font: 600 11px/1 var(--wxt-home-mono);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
}

.card {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
  width: var(--card-w);
  transform: translateY(-50%);
  padding: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
}
.icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  color: var(--wxt-c-green-accent);
}
.icon svg {
  width: 18px;
  height: 18px;
}
.text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.text b {
  font: 700 13px/1.2 var(--wxt-home-mono);
  color: var(--vp-c-text-1);
  white-space: nowrap;
}
.text small {
  font-size: 12px;
  line-height: 1.2;
  color: var(--vp-c-text-2);
  white-space: nowrap;
}

.hub {
  position: absolute;
  left: 50%;
  width: 124px;
  height: 124px;
  transform: translate(-50%, -50%);
  display: grid;
  place-items: center;
  box-sizing: border-box;
  border: 2px solid var(--wxt-c-green-accent);
  border-radius: 50%;
  background: var(--vp-c-bg);
  color: var(--wxt-c-green-accent);
  box-shadow:
    0 0 40px color-mix(in srgb, var(--wxt-c-green-accent) 35%, transparent),
    inset 0 0 0 10px var(--vp-c-bg-soft);
  animation: pulse var(--cycle) linear infinite;
}
.hub img {
  width: 46%;
  height: 46%;
}
@keyframes pulse {
  0%,
  7%,
  36%,
  100% {
    box-shadow:
      0 0 40px color-mix(in srgb, var(--wxt-c-green-accent) 35%, transparent),
      inset 0 0 0 10px var(--vp-c-bg-soft);
  }
  20.5% {
    box-shadow:
      0 0 70px color-mix(in srgb, var(--wxt-c-green-accent) 65%, transparent),
      inset 0 0 0 10px var(--vp-c-bg-soft);
  }
}

.browser-icon img {
  display: block;
  width: 22px;
  height: 22px;
}

@media (prefers-reduced-motion: reduce) {
  .flow,
  .hub {
    animation: none;
  }
  .flow {
    stroke-dasharray: none;
  }
}
</style>
