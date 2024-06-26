<script lang="ts" setup>
import { ref, onMounted, computed, toRaw, Ref } from 'vue';
import ExampleSearchFilterByItem from './ExampleSearchFilterByItem.vue';
import ExampleSearchResult from './ExampleSearchResult.vue';
import { ExamplesMetadata, KeySelectedObject } from '../utils/types';

const props = defineProps<{
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
  return exampleMetadata.value.examples.filter((example) => {
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
  <div>
    <div class="search-box">
      <input v-model="searchText" placeholder="Search for an example..." />
      <div class="divide-y" />
      <div class="checkbox-col-container">
        <ExampleSearchFilterByItem
          label="APIs"
          :items="exampleMetadata?.allApis"
          v-model="selectedApis"
        />
        <div class="divide-x" />
        <ExampleSearchFilterByItem
          label="Permissions"
          :items="exampleMetadata?.allPermissions"
          v-model="selectedPermissions"
        />
        <div class="divide-x" />
        <ExampleSearchFilterByItem
          label="Packages"
          :items="exampleMetadata?.allPackages"
          v-model="selectedPackages"
        />
      </div>
    </div>
    <p v-if="exampleMetadata == null">Loading examples...</p>
    <template v-else>
      <ul class="search-results">
        <ExampleSearchResult
          v-for="example of filteredExamples"
          :key="example.name"
          :example
        />
      </ul>
      <p v-if="filteredExamples.length === 0">No matching examples</p>
    </template>
  </div>
</template>

<style scoped>
.search-box {
  background: var(--vp-custom-block-info-bg);
  border-radius: 16px;
  margin-bottom: 32px;
}
.search-box input {
  padding: 20px;
  font-size: 16px;
  width: 100%;
}
.divide-y {
  height: 2px;
  background: var(--vp-c-bg);
}
.divide-x {
  width: 2px;
  background: var(--vp-c-bg);
}
.checkbox-col {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  max-height: 200px;
  font-size: 14px;
  gap: 4px;
}
.checkbox-col .header {
  font-size: 12px;
  font-weight: bold;
  opacity: 50%;
}
.checkbox-col p {
  display: flex;
  gap: 4px;
  align-items: flex-start;
  text-wrap: wrap;
  overflow-wrap: anywhere;
  line-height: 140%;
}
span {
  padding-top: 1px;
}
.checkbox-col input[type='checkbox'] {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.checkbox-col-container {
  display: flex;
}
.search-results {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
a {
  background-color: red;
}
</style>
