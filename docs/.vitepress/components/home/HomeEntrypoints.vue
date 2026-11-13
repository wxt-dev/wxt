<script lang="ts" setup>
import { ref } from 'vue';

import HomeCode from './HomeCode.vue';
import HomeSectionHead from './HomeSectionHead.vue';
import HomeWindow from './HomeWindow.vue';
import { stats } from './stats';

const entrypoints = [
  {
    file: 'background.ts',
    code: `export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });
});`,
    manifest: `{
  "background": {
    "service_worker": "background.js"
  }
}`,
  },
  {
    file: 'content.ts',
    code: `export default defineContentScript({
  matches: ['*://*.google.com/*'],
  main() {
    console.log('Hello content.');
  },
});`,
    manifest: `{
  "content_scripts": [
    {
      "matches": ["*://*.google.com/*"],
      "js": ["content-scripts/content.js"]
    }
  ]
}`,
  },
  {
    file: 'popup/index.html',
    code: `<!doctype html>
<html lang="en">
  <head>
    <title>Default Popup Title</title>
    <meta name="manifest.type" content="browser_action" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./main.ts"><\/script>
  </body>
</html>`,
    manifest: `{
  "action": {
    "default_title": "Default Popup Title",
    "default_popup": "popup.html"
  }
}`,
  },
  {
    file: 'options/index.html',
    code: `<!doctype html>
<html lang="en">
  <head>
    <title>Options</title>
    <meta name="manifest.open_in_tab" content="true" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./main.ts"><\/script>
  </body>
</html>`,
    manifest: `{
  "options_ui": {
    "page": "options.html",
    "open_in_tab": true
  }
}`,
  },
];

type TreeNode = { name: string; depth: number; dir?: boolean; entry?: number };
const tree: TreeNode[] = [
  { name: 'entrypoints', depth: 0, dir: true },
  { name: 'background.ts', depth: 1, entry: 0 },
  { name: 'content.ts', depth: 1, entry: 1 },
  { name: 'popup', depth: 1, dir: true },
  { name: 'index.html', depth: 2, entry: 2 },
  { name: 'options', depth: 1, dir: true },
  { name: 'index.html', depth: 2, entry: 3 },
  { name: 'public', depth: 0, dir: true },
  { name: 'wxt.config.ts', depth: 0 },
  { name: 'package.json', depth: 0 },
];

const active = ref(0);
</script>

<template>
  <section>
    <HomeSectionHead count="04" title="Your file tree is your manifest.">
      Drop a file in <span class="mono">entrypoints/</span> and WXT wires up the
      manifest, bundling, and reloading.
    </HomeSectionHead>

    <HomeWindow>
      <div class="body">
        <div
          class="hw-tabbar mobile-tabs"
          role="tablist"
          aria-label="Entrypoints"
        >
          <button
            v-for="(entrypoint, i) in entrypoints"
            :key="entrypoint.file"
            class="hw-tab"
            :class="{ on: i === active }"
            role="tab"
            :aria-selected="i === active"
            @click="active = i"
          >
            {{ entrypoint.file }}
          </button>
        </div>
        <nav class="hw-tree" aria-label="Project files">
          <template v-for="(node, i) in tree" :key="i">
            <button
              v-if="node.entry != null"
              class="hw-node link"
              :class="{ on: node.entry === active }"
              :style="{ paddingLeft: 10 + node.depth * 12 + 'px' }"
              @click="active = node.entry"
            >
              <span class="hw-chev" aria-hidden="true" />{{ node.name }}
            </button>
            <div
              v-else
              class="hw-node"
              :class="{ dir: node.dir }"
              :style="{ paddingLeft: 10 + node.depth * 12 + 'px' }"
            >
              <span class="hw-chev" aria-hidden="true">{{
                node.dir ? '›' : ''
              }}</span
              >{{ node.name }}
            </div>
          </template>
        </nav>
        <div class="hw-pane">
          <div class="hw-tabbar code-tab">
            <span class="hw-tab on">{{ entrypoints[active].file }}</span>
          </div>
          <HomeCode :source="entrypoints[active].code" />
        </div>
        <div class="hw-pane output">
          <div class="hw-tabbar">
            <span class="hw-tab on">.output/chrome-mv3/manifest.json</span>
          </div>
          <HomeCode :source="entrypoints[active].manifest" />
        </div>
      </div>
      <template #status>
        <span>Target <b>chrome-mv3</b></span>
        <span>Built in <b>{{ stats.builtIn }}</b></span>
        <span class="right">TypeScript</span>
      </template>
    </HomeWindow>
  </section>
</template>

<style scoped>
.mono {
  font: 0.88em var(--wxt-home-mono);
  padding: 2px 6px;
  border-radius: 5px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.body {
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr) minmax(0, 1fr);
  min-height: 300px;
}
.output {
  border-left: 1px solid var(--hw-line);
}
.mobile-tabs {
  display: none;
}

@media (max-width: 960px) {
  .body {
    grid-template-columns: 160px minmax(0, 1fr);
  }
  .output {
    grid-column: 1 / -1;
    border-left: 0;
    border-top: 1px solid var(--hw-line);
  }
}
@media (max-width: 640px) {
  .body {
    grid-template-columns: minmax(0, 1fr);
  }
  /* The file tree doesn't fit, so the entrypoints become tabs instead. */
  .body :deep(.hw-tree),
  .code-tab {
    display: none;
  }
  .mobile-tabs {
    display: flex;
    height: 38px;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .mobile-tabs::-webkit-scrollbar {
    display: none;
  }
  .mobile-tabs .hw-tab {
    flex: none;
    cursor: pointer;
    border-right: 1px solid var(--hw-line);
  }
}
</style>
