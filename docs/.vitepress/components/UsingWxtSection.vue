<script lang="ts" setup>
import { computed } from 'vue';
import useListExtensionDetails from '../composables/useListExtensionDetails';
import _extensionEntries from '../../assets/extension-showcase.yml';

interface StoreLink {
  label: string;
  url: string;
}

interface ListedExtension {
  id: string;
  name: string;
  iconUrl: string;
  shortDescription: string;
  users: number;
  rating: number | undefined;
  stores: StoreLink[];
}

const extensionEntries = _extensionEntries as Array<{
  chromeId?: string;
  firefoxSlug?: string;
}>;

const chromeIds = extensionEntries.flatMap((e) =>
  e.chromeId ? [e.chromeId] : [],
);
const firefoxSlugs = [
  ...new Set(
    extensionEntries.flatMap((e) => (e.firefoxSlug ? [e.firefoxSlug] : [])),
  ),
];

const { data, isLoading } = useListExtensionDetails(chromeIds, firefoxSlugs);

function addUtmSource(storeUrl: string): string {
  const url = new URL(storeUrl);
  url.searchParams.set('utm_source', 'wxt.dev');
  return url.href;
}

const sortedExtensions = computed((): ListedExtension[] => {
  if (!data.value) return [];

  const chromeById = new Map(
    (data.value.chrome ?? []).filter(Boolean).map((e) => [e.id, e]),
  );
  const firefoxBySlug = new Map(
    (data.value.firefox ?? []).filter(Boolean).map((e) => [e.id, e]),
  );

  const results: ListedExtension[] = [];

  for (const entry of extensionEntries) {
    const chrome = entry.chromeId ? chromeById.get(entry.chromeId) : undefined;
    const firefox = entry.firefoxSlug
      ? firefoxBySlug.get(entry.firefoxSlug)
      : undefined;

    if (!chrome && !firefox) continue;

    const primary = chrome ?? firefox!;
    const users = (chrome?.users ?? 0) + (firefox?.users ?? 0);
    const rating = chrome?.rating ?? firefox?.rating;

    const stores: StoreLink[] = [];
    if (chrome) {
      stores.push({ label: 'Chrome', url: addUtmSource(chrome.storeUrl) });
    }
    if (firefox) {
      stores.push({ label: 'Firefox', url: addUtmSource(firefox.storeUrl) });
    }

    results.push({
      id: entry.chromeId ?? `firefox:${entry.firefoxSlug}`,
      name: primary.name,
      iconUrl: primary.iconUrl,
      shortDescription: primary.shortDescription,
      users,
      rating,
      stores,
    });
  }

  const score = (e: ListedExtension) => ((e.rating ?? 5) / 5) * e.users;
  return results.sort((a, b) => score(b) - score(a));
});

function formatUsers(n: number): string {
  return `${n.toLocaleString()} users`;
}

function formatStars(r: number): string {
  const rounded = Math.round(r * 10) / 10;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)} stars`;
}
</script>

<template>
  <p v-if="isLoading" style="text-align: center; opacity: 50%">Loading...</p>
  <p
    v-else-if="sortedExtensions.length === 0"
    style="text-align: center; opacity: 50%"
  >
    Failed to load extension details.
  </p>
  <ul v-else class="extension-grid">
    <li v-for="extension of sortedExtensions" :key="extension.id">
      <img
        :src="extension.iconUrl"
        :alt="`${extension.name} icon`"
        referrerpolicy="no-referrer"
      />
      <div class="card-content">
        <a
          :href="extension.stores[0]?.url ?? '#'"
          target="_blank"
          :title="extension.name"
          class="extension-name"
          >{{ extension.name }}</a
        >
        <p class="description" :title="extension.shortDescription">
          {{ extension.shortDescription }}
        </p>
        <div v-if="extension.stores.length > 0" class="store-stats">
          <span class="store-stats-info">
            <span>{{ formatUsers(extension.users) }}</span>
            <template v-if="extension.rating">
              <span class="store-stats-sep" aria-hidden="true">,</span>
              <span>{{ formatStars(extension.rating) }}</span>
            </template>
          </span>
          <span class="store-stats-sep" aria-hidden="true">&middot;</span>
          <span class="store-links">
            <a
              v-for="(store, i) of extension.stores"
              :key="store.label"
              :href="store.url"
              target="_blank"
              class="store-link"
              :title="store.label"
            >
              {{ store.label
              }}<span
                v-if="i < extension.stores.length - 1"
                class="store-stats-sep"
                aria-hidden="true"
                >,&nbsp;</span
              >
            </a>
          </span>
        </div>
      </div>
    </li>
  </ul>
  <p class="centered pr">
    <a
      href="https://github.com/wxt-dev/wxt/edit/main/docs/assets/extension-showcase.yml"
      target="_blank"
      >Open a PR</a
    >
    to add your extension to the list!
  </p>
</template>

<style scoped>
.extension-grid > li > img {
  width: 116px;
  height: 116px;
  padding: 16px;
  border-radius: 8px;
  background-color: var(--vp-c-default-soft);
}

.extension-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  align-items: stretch;
  gap: 16px;
  list-style: none;
  margin: 16px 0;
  padding: 0;
}
@media (min-width: 960px) {
  .extension-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.extension-grid > li {
  margin: 0 !important;
  padding: 16px;
  display: flex;
  background-color: var(--vp-c-bg-soft);
  border-radius: 12px;
  flex: 1;
  gap: 24px;
  align-items: stretch;
}

.centered {
  text-align: center;
}

.extension-grid > li .description {
  padding: 0;
  margin: 0;
}

.extension-grid > li .card-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 0;
}

.store-stats {
  margin-top: auto;
  padding-top: 6px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: baseline;
  column-gap: 6px;
  row-gap: 4px;
  text-align: right;
  font-size: 12px;
  line-height: 1.45;
  opacity: 0.72;
  color: var(--vp-c-text-2);
}

.store-stats-info {
  display: inline;
}

.store-stats-sep {
  opacity: 0.45;
  user-select: none;
}

.store-links {
  display: inline;
}

.store-link {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.store-link:hover {
  color: var(--vp-c-text-1);
  text-decoration: underline;
}

.extension-grid > li .extension-name {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  margin: 0;
  text-decoration: none;
  font-size: large;
}

.extension-grid > li .extension-name:hover {
  text-decoration: underline;
}

.extension-grid > li .description {
  opacity: 90%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 0 !important;
}

.pr {
  opacity: 70%;
}
</style>
