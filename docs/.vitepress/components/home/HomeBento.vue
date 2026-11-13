<script lang="ts" setup>
import Icon from '../Icon.vue';
import HomeSectionHead from './HomeSectionHead.vue';

const icons = {
  dev: 'M13 2L4 14h7l-1 8 9-12h-7z',
  entrypoints: 'M4 4h6l2 2h8v14H4z',
  typescript: 'M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14',
  imports: 'M12 3v12M7 10l5 5 5-5M4 20h16',
  frameworks: 'M4 4h16v16H4zM4 9h16M9 9v11',
  publish: 'M12 21V9M7 14l5-5 5 5M4 4h16',
};

const frameworks = [
  { name: 'React' },
  { name: 'Vue' },
  { name: 'Svelte' },
  {
    name: 'Solid',
    icon: 'https://www.solidjs.com/img/favicons/favicon-32x32.png',
  },
];

interface Card {
  title: string;
  text: string;
  icon: string;
  href: string;
  logos?: boolean;
}

const cards: Card[] = [
  {
    title: 'TypeScript by default',
    text: 'Create large projects with confidence. WXT generates the types for your project.',
    icon: icons.typescript,
    href: '/guide/essentials/config/typescript',
  },
  {
    title: 'Auto-imports',
    text: 'Browser APIs and WXT utilities are imported for you, Nuxt style.',
    icon: icons.imports,
    href: '/guide/essentials/config/auto-imports',
  },
  {
    title: 'Any framework',
    text: 'Works with any frontend framework that has a Vite plugin.',
    icon: icons.frameworks,
    href: '/guide/essentials/frontend-frameworks',
    logos: true,
  },
  {
    title: 'Publish from the CLI',
    text: 'Zip, upload, and submit to the stores without a separate release script.',
    icon: icons.publish,
    href: '/guide/essentials/publishing',
  },
];

const links = [
  [
    'MV2 and MV3',
    '/guide/essentials/target-different-browsers#target-a-manifest-version',
  ],
  ['Module system', '/guide/essentials/wxt-modules'],
  ['Bundle analysis', '/api/reference/wxt/interfaces/InlineConfig#analysis'],
  ['Starter templates', '/guide/installation#bootstrap-project'],
  ['Publishing', '/guide/essentials/publishing'],
];
</script>

<template>
  <section>
    <HomeSectionHead count="02" title="Everything the build needs.">
      Manifest generation, a dev server, and release zips come built in. Add a
      frontend framework when you need one.
    </HomeSectionHead>

    <div class="grid">
      <article class="card wide">
        <span class="icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path :d="icons.dev" />
          </svg>
        </span>
        <h3>Fast dev mode</h3>
        <p>
          HMR for your UI and fast reloads for content and background scripts.
        </p>
        <span class="chip"><span class="prompt">$</span> wxt</span>
      </article>

      <a class="card wide" href="/guide/essentials/project-structure">
        <span class="icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path :d="icons.entrypoints" />
          </svg>
        </span>
        <h3>File-based entrypoints</h3>
        <p>
          Drop a file in <span class="mono">entrypoints/</span> and WXT wires it
          into the manifest.
        </p>
        <span class="chips">
          <span class="chip">entrypoints/popup/index.html</span>
          <span class="arrow" aria-hidden="true">→</span>
          <span class="chip accent">popup.html</span>
        </span>
      </a>

      <a v-for="card in cards" :key="card.title" class="card" :href="card.href">
        <span class="icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path :d="card.icon" />
          </svg>
        </span>
        <h3>{{ card.title }}</h3>
        <p>{{ card.text }}</p>
        <span v-if="card.logos" class="logos">
          <Icon
            v-for="framework in frameworks"
            :key="framework.name"
            :name="framework.name"
            :icon="framework.icon"
          />
        </span>
      </a>
    </div>

    <ul class="links">
      <li v-for="[text, href] in links" :key="href">
        <a :href="href">{{ text }} <span aria-hidden="true">↗&#xFE0E;</span></a>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 22px;
  border: 1px solid var(--wxt-c-card-border);
  border-radius: 16px;
  background: var(--wxt-c-bg-panel);
  font-weight: 400;
  text-decoration: none;
  transition: border-color 0.2s;
}
a.card:hover {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 50%, transparent);
}
.card.wide {
  grid-column: span 2;
  min-height: 230px;
  background:
    radial-gradient(
      90% 70% at 70% 0%,
      color-mix(in srgb, var(--vp-c-brand-1) 14%, transparent),
      transparent
    ),
    var(--wxt-c-bg-panel);
}

.icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  margin-bottom: 18px;
  border-radius: 10px;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}
.icon svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.card h3 {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 17px;
  line-height: 1.3;
  letter-spacing: normal;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.card p {
  max-width: 34ch;
  margin: 8px 0 0;
  font-size: 14.5px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.mono,
.chip {
  font-family: var(--wxt-home-mono);
}
.mono {
  font-size: 0.9em;
  color: var(--vp-c-text-1);
}
.chips {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: auto;
  padding-top: 18px;
}
.chip {
  align-self: flex-start;
  margin-top: auto;
  padding: 5px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--vp-c-text-2);
}
.chips .chip {
  margin-top: 0;
}
.chip.accent {
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 50%, transparent);
  color: var(--vp-c-brand-1);
}
.chip .prompt {
  color: var(--vp-c-text-3);
}
.arrow {
  color: var(--vp-c-text-3);
}

.logos {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: auto;
  padding-top: 18px;
}
.logos :deep(img) {
  width: 22px;
  margin: 0;
  transform: none;
  filter: grayscale(1);
  opacity: 0.7;
  transition:
    filter 0.2s,
    opacity 0.2s;
}
.logos :deep(img:hover) {
  filter: none;
  opacity: 1;
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 28px;
  margin: 28px 0 0;
  padding: 20px 0 0;
  border-top: 1px solid var(--vp-c-divider);
  list-style: none;
}
.links li {
  margin: 0;
}
.links a {
  font-size: 14.5px;
  font-weight: 500;
  text-decoration: none;
  color: var(--vp-c-text-2);
}
.links a:hover {
  color: var(--vp-c-brand-1);
}
.links a span {
  font-size: 0.85em;
  opacity: 0.7;
}

@media (max-width: 960px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .card.wide {
    grid-column: auto;
    min-height: 0;
  }
}
</style>
