<script lang="ts" setup>
import { computed, ref } from 'vue';

import HomeCode from './HomeCode.vue';
import HomeSectionHead from './HomeSectionHead.vue';
import HomeWindow from './HomeWindow.vue';
import { stats } from './stats';

const manifests = {
  3: `{
  "manifest_version": 3,
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html"
  }
}`,
  2: `{
  "manifest_version": 2,
  "background": {
    "scripts": ["background.js"],
    "persistent": false
  },
  "browser_action": {
    "default_popup": "popup.html"
  }
}`,
};

// Matches the defaults documented in "Targeting Different Browsers": MV2 for
// Firefox and Safari, MV3 for everything else.
const browsers = [
  { name: 'Chrome', flag: '', target: 'chrome-mv3', mv: 3 as const },
  {
    name: 'Firefox',
    flag: ' -b firefox',
    target: 'firefox-mv2',
    mv: 2 as const,
  },
  { name: 'Edge', flag: ' -b edge', target: 'edge-mv3', mv: 3 as const },
  { name: 'Safari', flag: ' -b safari', target: 'safari-mv2', mv: 2 as const },
];

const active = ref(0);
const browser = computed(() => browsers[active.value]);
const manifest = computed(() => manifests[browser.value.mv]);
</script>

<template>
  <section>
    <HomeSectionHead count="03" title="One codebase. Every browser." center>
      Pick a target and WXT handles the manifest version and browser differences
      for you.
    </HomeSectionHead>

    <div class="tabs" role="tablist" aria-label="Browser">
      <button
        v-for="(b, i) in browsers"
        :key="b.name"
        role="tab"
        :aria-selected="i === active"
        :class="{ on: i === active }"
        @click="active = i"
      >
        {{ b.name }}
      </button>
    </div>

    <HomeWindow>
      <div class="body">
        <div class="hw-pane">
          <div class="hw-tabbar"><span class="hw-tab on">Terminal</span></div>
          <div class="hw-term">
            <p><span class="prompt">$</span>wxt build{{ browser.flag }}</p>
            <p>
              <span class="cyan">ℹ</span> Building
              <span class="cyan">{{ browser.target }}</span> for
              <span class="cyan">production</span> with
              <span class="ok">Vite {{ stats.vite }}</span>
            </p>
            <p>
              <span class="ok">✔</span> Built extension in {{ stats.builtIn }}
            </p>
            <p class="dim">
              &nbsp;&nbsp;└─ .output/{{ browser.target }}/<span class="cyan"
                >manifest.json</span
              >
              {{ stats.manifestSize }}
            </p>
            <p><span class="cyan">Σ</span> Total size: {{ stats.totalSize }}</p>
          </div>
        </div>
        <div class="hw-pane output">
          <div class="hw-tabbar">
            <span class="hw-tab on"
              >.output/{{ browser.target }}/manifest.json</span
            >
          </div>
          <HomeCode :source="manifest" />
        </div>
      </div>
      <template #status>
        <span>Manifest <b>MV{{ browser.mv }}</b></span>
        <span>Target <b>{{ browser.target }}</b></span>
      </template>
    </HomeWindow>

    <p v-if="browser.name === 'Safari'" class="note">
      Safari extensions need a native app wrapper.
      <a href="/guide/essentials/publishing#safari">Read the Safari guide →</a>
    </p>
  </section>
</template>

<style scoped>
.tabs {
  display: flex;
  justify-content: center;
  gap: 4px;
  width: fit-content;
  margin: -12px auto 28px;
  padding: 4px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
}
.tabs button {
  all: unset;
  cursor: pointer;
  padding: 7px 18px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}
.tabs button:hover {
  color: var(--vp-c-text-1);
}
.tabs button.on {
  background: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
}
.tabs button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
}

.body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  min-height: 260px;
}
.output {
  border-left: 1px solid var(--hw-line);
}

.note {
  margin: 16px 0 0;
  text-align: center;
  font-size: 14px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}
.note a {
  font-weight: 600;
  text-decoration: none;
  color: var(--vp-c-brand-1);
}
.note a:hover {
  text-decoration: underline;
  color: var(--vp-c-brand-2);
}

@media (max-width: 640px) {
  .body {
    grid-template-columns: minmax(0, 1fr);
  }
  .output {
    border-left: 0;
    border-top: 1px solid var(--hw-line);
  }
  .tabs button {
    padding: 7px 12px;
  }
}
</style>
