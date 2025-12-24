<script lang="ts" setup>
import { computed, onMounted, ref, Ref, toRaw } from 'vue';
import ExampleSearchFilterByItem from './ExampleSearchFilterByItem.vue';
import ExampleSearchResult from './ExampleSearchResult.vue';
import { ExamplesMetadata, KeySelectedObject } from '../utils/types';

defineProps<{
  tag?: string;
}>();

const exampleMetadata = ref<ExamplesMetadata>();
onMounted(async () => {
  const res = await fetch(
    'https://raw.githubusercontent.com/wxt-dev/examples/main/metadata.json',
  );
  exampleMetadata.value = await res.json();
});

const searchText = ref('');
const selectedApis = ref<KeySelectedObject>({});
const selectedPermissions = ref<KeySelectedObject>({});
const selectedPackages = ref<KeySelectedObject>({});

function useRequiredItems(selectedItems: Ref<KeySelectedObject>) {
  return computed(() =>
    Array.from(
      Object.entries(toRaw(selectedItems.value)).reduce(
        (set, [pkg, checked]) => {
          if (checked) set.add(pkg);
          return set;
        },
        new Set<string>(),
      ),
    ),
  );
}
const requiredApis = useRequiredItems(selectedApis);
const requiredPermissions = useRequiredItems(selectedPermissions);
const requiredPackages = useRequiredItems(selectedPackages);

function doesExampleMatchSelected(
  exampleItems: string[],
  requiredItems: Ref<string[]>,
) {
  const exampleItemsSet = new Set(exampleItems);
  return !requiredItems.value.find((item) => !exampleItemsSet.has(item));
}

const filteredExamples = computed(() => {
  const text = searchText.value.toLowerCase();
  return exampleMetadata.value?.examples.filter((example) => {
    const matchesText = example.searchText.toLowerCase().includes(text);
    const matchesApis = doesExampleMatchSelected(example.apis, requiredApis);
    const matchesPermissions = doesExampleMatchSelected(
      example.permissions,
      requiredPermissions,
    );
    const matchesPackages = doesExampleMatchSelected(
      example.packages,
      requiredPackages,
    );
    return matchesText && matchesApis && matchesPermissions && matchesPackages;
  });
});
</script>

<template>
  <div class="example-layout">
    <div class="search">
      <input v-model="searchText" placeholder="Search for an example..." />
    </div>

    <div class="filters">
      <ExampleSearchFilterByItem
        v-model="selectedApis"
        :items="exampleMetadata?.allApis"
        label="APIs"
      />
      <ExampleSearchFilterByItem
        v-model="selectedPermissions"
        :items="exampleMetadata?.allPermissions"
        label="Permissions"
      />
      <ExampleSearchFilterByItem
        v-model="selectedPackages"
        :items="exampleMetadata?.allPackages"
        label="Packages"
      />
    </div>

    <div class="results">
      <p v-if="exampleMetadata == null">Loading examples...</p>
      <template v-else>
        <ul class="search-results">
          <ExampleSearchResult
            v-for="example of filteredExamples"
            :key="example.name"
            :example
          />
        </ul>
        <p v-if="!filteredExamples?.length">No matching examples</p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.example-layout {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  grid-template-areas:
    'search'
    'results';
  gap: 16px;
}

@media only screen and (min-width: 720px) {
  .example-layout {
    grid-template-columns: 256px 1fr;
    grid-template-rows: auto 1fr;
    grid-template-areas:
      'filters search'
      'filters results';
  }
}

.search {
  grid-area: search;
  background: var(--vp-c-bg-soft);
  padding: 20px;
  border-radius: 16px;
}

.filters {
  grid-area: filters;
}

@media only screen and (min-width: 720px) {
  .filters {
    display: flex;
    flex-direction: column;
    gap: 10px;
    border-radius: 16px;
  }
}

.results {
  grid-area: results;
}

.search input {
  font-size: 16px;
}

.search-results {
  display: grid;
  gap: 16px;
}

@media only screen and (min-width: 800px) {
  .search-results {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media only screen and (min-width: 1024px) {
  .search-results {
    grid-template-columns: repeat(3, 1fr);
  }
}

a {
  background-color: red;
}
</style>
