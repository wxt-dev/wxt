<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import HomeSectionHead from './HomeSectionHead.vue';
import HomeWindow from './HomeWindow.vue';
import {
  applyEvent,
  finalLines,
  type LineState,
  parseMarkup,
  steps,
} from './workflowSteps';

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const TYPE_DELAY = 28;
const LINE_HEIGHT = 12.5 * 1.7;
// Fixed terminal size. Longer output scrolls, like a real terminal.
const ROWS = 16;

const active = ref(0);
const typed = ref('');
const typing = ref(false);
const lines = ref<LineState[]>([]);
const spinnerFrame = ref(SPINNER[0]);
const windowEl = ref<HTMLElement>();

const terminalHeight = `${Math.ceil(ROWS * LINE_HEIGHT + 32)}px`;

// The command line is row 0 and scrolls off the top once output overflows.
const visibleLines = computed(() => {
  const overflow = Math.max(0, lines.value.length + 1 - ROWS);
  return {
    showCommand: overflow === 0,
    lines: lines.value.slice(Math.max(0, overflow - 1)),
  };
});

let timers: number[] = [];
let spinnerTimer: number | undefined;
let observer: IntersectionObserver | undefined;
let reducedMotion = false;

function stop() {
  timers.forEach(clearTimeout);
  timers = [];
  clearInterval(spinnerTimer);
  spinnerTimer = undefined;
}

function later(fn: () => void, ms: number) {
  timers.push(window.setTimeout(fn, ms));
}

function play(index: number) {
  observer?.disconnect();
  stop();
  const step = steps[index];
  lines.value = [];

  if (reducedMotion) {
    typed.value = step.command;
    typing.value = false;
    lines.value = finalLines(step);
    return;
  }

  typed.value = '';
  typing.value = true;
  let typedCount = 0;
  const type = () => {
    typedCount++;
    typed.value = step.command.slice(0, typedCount);
    if (typedCount < step.command.length) {
      later(type, TYPE_DELAY);
    } else {
      later(() => {
        typing.value = false;
        run(index);
      }, 350);
    }
  };
  type();
}

function run(index: number) {
  const { events } = steps[index];
  let frame = 0;
  spinnerTimer = window.setInterval(() => {
    frame = (frame + 1) % SPINNER.length;
    spinnerFrame.value = SPINNER[frame];
  }, 80);
  for (const event of events) {
    later(() => {
      lines.value = applyEvent(lines.value, event);
    }, event.at);
  }
  later(stop, events[events.length - 1].at + 100);
}

function select(index: number) {
  active.value = index;
  play(index);
}

onMounted(() => {
  reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    play(active.value);
    return;
  }
  // Wait until the terminal is on screen so visitors see it from the start.
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) play(active.value);
    },
    { threshold: 0.5 },
  );
  if (windowEl.value) observer.observe(windowEl.value);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  stop();
});
</script>

<template>
  <section class="workflow">
    <div class="copy">
      <HomeSectionHead count="05" title="Create, develop, ship.">
        One toolchain from the first scaffold to the store submission. No
        separate build scripts to maintain.
      </HomeSectionHead>
      <ul class="steps" role="tablist" aria-label="Commands">
        <li v-for="(step, i) in steps" :key="step.name">
          <button
            class="step"
            :class="{ on: i === active }"
            role="tab"
            :aria-selected="i === active"
            @click="select(i)"
          >
            <span class="name">{{ step.name }}</span>
            <span class="text">{{ step.description }}</span>
          </button>
        </li>
      </ul>
    </div>

    <div ref="windowEl">
      <HomeWindow>
        <div
          class="hw-term"
          :style="{
            flex: 'none',
            boxSizing: 'border-box',
            height: terminalHeight,
          }"
        >
          <p v-if="visibleLines.showCommand">
            <span class="prompt">$</span>{{ typed
            }}<span v-if="typing" class="caret" />
          </p>
          <p v-for="(line, i) in visibleLines.lines" :key="i">
            <template v-for="(segment, j) in parseMarkup(line.text)" :key="j"
              ><span :class="segment.cls">{{
                segment.spin ? spinnerFrame : segment.text
              }}</span></template
            >
          </p>
        </div>
      </HomeWindow>
    </div>
  </section>
</template>

<style scoped>
.workflow {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  gap: 64px;
  align-items: center;
}
.copy :deep(.head) {
  margin-bottom: 28px;
}

.steps {
  margin: 0;
  padding: 0;
  list-style: none;
}
.steps li {
  margin: 0;
}
.steps li:first-child .step {
  border-top: 1px solid var(--vp-c-divider);
}
.step {
  all: unset;
  box-sizing: border-box;
  position: relative;
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr);
  gap: 16px;
  width: 100%;
  padding: 14px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  line-height: 1.55;
  cursor: pointer;
  transition: background 0.2s;
}
.step::before {
  content: '';
  position: absolute;
  left: 0;
  top: -1px;
  bottom: -1px;
  width: 2px;
  background: var(--vp-c-brand-1);
  opacity: 0;
  transition: opacity 0.2s;
}
.step.on {
  background: var(--vp-c-brand-soft);
}
.step.on::before {
  opacity: 1;
}
.step:hover:not(.on) {
  background: var(--vp-c-bg-soft);
}
.step:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: -2px;
}
.name {
  font: 500 13px/1.55 var(--wxt-home-mono);
  color: var(--vp-c-brand-1);
}
.text {
  color: var(--vp-c-text-2);
}
.step.on .text {
  color: var(--vp-c-text-1);
}

.caret {
  display: inline-block;
  width: 0.55em;
  height: 1.15em;
  margin-left: 1px;
  vertical-align: text-bottom;
  background: var(--hw-fg);
  animation: caret-blink 1s steps(1) infinite;
}
@keyframes caret-blink {
  50% {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .caret {
    animation: none;
  }
}

@media (max-width: 960px) {
  .workflow {
    grid-template-columns: minmax(0, 1fr);
    gap: 40px;
  }
}
</style>
