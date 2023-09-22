<script lang="ts" setup>
import useListExtensionDetails from '../composables/useListExtensionDetails';

const chromeExtensionIds = [
  'ocfdgncpifmegplaglcnglhioflaimkd', // GitHub: Better Line Counts
];

const { data } = useListExtensionDetails(chromeExtensionIds);
</script>

<template>
  <section class="vp-doc">
    <div class="container">
      <h2>Who's Using WXT?</h2>
      <ul>
        <li v-for="extension of data">
          <img
            :src="extension.iconUrl"
            :alt="`${extension.name} icon`"
            referrerpolicy="no-referrer"
          />
          <a :href="extension.storeUrl" target="_blank">{{ extension.name }}</a>
          <small>{{ extension.shortDescription }}</small>
        </li>
      </ul>
      <p>Open a PR to add your extension to the list!</p>
    </div>
  </section>
</template>

<style scoped>
.vp-doc {
  padding: 0 24px;
}

h2 {
  margin-bottom: 32px;
}

@media (min-width: 640px) {
  .vp-doc {
    padding: 0 48px;
  }
}

@media (min-width: 960px) {
  .vp-doc {
    padding: 0 64px;
  }
}

.container {
  max-width: 1152px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

img {
  width: 96px;
  height: 96px;
  margin-bottom: 16px;
  border-radius: 8px;
}

ul {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  align-items: stretch;
  gap: 16px;
  list-style: none;
  margin: 0;
  padding: 0;
}
@media (min-width: 640px) {
  ul {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 960px) {
  ul {
    grid-template-columns: repeat(4, 1fr);
  }
}

li {
  margin: 0 !important;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--vp-c-bg-soft);
  border-radius: 12px;
  flex: 1;
}
a,
small {
  text-align: center;
}
small {
  opacity: 50%;
}

p {
  text-align: center;
  opacity: 50%;
}
a {
  color: var(--vp-c-text-1);
  cursor: pointer;
}
</style>
