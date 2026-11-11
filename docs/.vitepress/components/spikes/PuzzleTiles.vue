<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

// Tab on top + right, socket on left + bottom. Tiles on an 80px pitch
// interlock perfectly.
const PIECE =
  'M20 20H44C44 8 52 4 60 4C68 4 76 8 76 20H100V44C112 44 116 52 116 60C116 68 112 76 100 76V100H76C76 88 68 84 60 84C52 84 44 88 44 100H20V76C32 76 36 68 36 60C36 52 32 44 20 44Z';

const props = defineProps<{
  items: { label: string; sub: string }[];
  desktopCols: number;
  mobileCols: number;
  active?: number[];
}>();

const mobile = ref(false);
let mq: MediaQueryList | undefined;
const onChange = () => (mobile.value = !!mq?.matches);
onMounted(() => {
  mq = matchMedia('(max-width: 640px)');
  onChange();
  mq.addEventListener('change', onChange);
});
onBeforeUnmount(() => mq?.removeEventListener('change', onChange));

const cols = computed(() =>
  Math.min(
    mobile.value ? props.mobileCols : props.desktopCols,
    props.items.length,
  ),
);
const rows = computed(() => Math.ceil(props.items.length / cols.value));
const viewBox = computed(() => {
  const w = 80 * (cols.value - 1) + 112 + 4;
  const h = 80 * (rows.value - 1) + 96 + 4;
  return `2 2 ${w} ${h}`;
});
const tiles = computed(() =>
  props.items.map((item, i) => ({
    ...item,
    x: (i % cols.value) * 80,
    y: Math.floor(i / cols.value) * 80,
    i,
    on: props.active?.includes(i),
  })),
);
</script>

<template>
  <svg class="tiles" :viewBox="viewBox" role="list">
    <g
      v-for="t in tiles"
      :key="t.label"
      role="listitem"
      :transform="`translate(${t.x} ${t.y})`"
    >
      <g
        class="tile"
        :class="{ on: t.on }"
        :style="{
          '--i': t.i,
          '--sx': (t.i % 2 ? 1 : -1) * 36 + 'px',
          '--sy': (t.i % 3 === 0 ? -1 : 1) * 28 + 'px',
        }"
      >
        <path :d="PIECE" />
        <text x="64" y="57" class="label">{{ t.label }}</text>
        <text x="64" y="68" class="sub">{{ t.sub }}</text>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.tiles {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}
.tile path {
  fill: var(--pz-tile, var(--vp-c-bg-soft));
  stroke: var(--pz-line, var(--vp-c-divider));
  stroke-width: 1.4;
  stroke-linejoin: round;
  transition:
    fill 0.25s,
    stroke 0.25s;
}
.tile.on path,
.tile:hover path {
  fill: var(--vp-c-brand-soft);
  stroke: var(--vp-c-brand-1);
}
.tile {
  animation: snap 0.8s cubic-bezier(0.2, 0.9, 0.25, 1.1) both;
  animation-delay: calc(var(--i) * 90ms);
}
.label {
  text-anchor: middle;
  font:
    600 8.5px var(--vp-font-family-base),
    sans-serif;
  fill: var(--vp-c-text-1);
}
.sub {
  text-anchor: middle;
  font:
    5.2px ui-monospace,
    SFMono-Regular,
    Menlo,
    Consolas,
    monospace;
  fill: var(--vp-c-text-2);
}
@keyframes snap {
  from {
    opacity: 0;
    transform: translate(var(--sx), var(--sy)) rotate(6deg);
  }
  60% {
    opacity: 1;
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .tile {
    animation: none;
  }
}
</style>
