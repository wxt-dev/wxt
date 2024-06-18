<script lang="ts" setup>
import { ref, onMounted, computed, toRaw } from 'vue';

const props = defineProps<{
  tag?: string;
}>();

const exampleMetadata = ref<{
  examples: Array<{
    name: string;
    description?: string;
    url: string;
    searchText: string;
    apis: string[];
    permissions: string[];
    packages: string[];
  }>;
  allApis: string[];
  allPermissions: string[];
  allPackages: string[];
}>();
onMounted(async () => {
  const res = await fetch(
    'https://raw.githubusercontent.com/wxt-dev/examples/main/metadata.json',
  );
  exampleMetadata.value = await res.json();
});

const searchText = ref('');
const selectedPackages = ref<Record<string, boolean | undefined>>({});
function togglePackage(pkg: string) {
  selectedPackages.value = {
    ...toRaw(selectedPackages.value),
    [pkg]: !selectedPackages.value[pkg],
  };
}

const selectedApis = ref<Record<string, boolean | undefined>>({});
function toggleApi(api: string) {
  selectedApis.value = {
    ...toRaw(selectedApis.value),
    [api]: !selectedApis.value[api],
  };
}

const selectedPermissions = ref<Record<string, boolean | undefined>>({});
function togglePermission(permission: string) {
  selectedPermissions.value = {
    ...toRaw(selectedPermissions.value),
    [permission]: !selectedPermissions.value[permission],
  };
}

const filteredExamples = computed(() => {
  const text = searchText.value.toLowerCase();
  const getRequired = (hash: Record<string, boolean | undefined>) =>
    Object.entries(toRaw(hash)).reduce((set, [pkg, checked]) => {
      if (checked) set.add(pkg);
      return set;
    }, new Set<string>());
  const requiredPackages = [...getRequired(selectedPackages.value)];
  const requiredApis = [...getRequired(selectedApis.value)];
  const requiredPermissions = [...getRequired(selectedPermissions.value)];
  return exampleMetadata.value.examples.filter((example) => {
    const matchesText = example.searchText.toLowerCase().includes(text);
    const exampleApis = new Set(example.apis);
    const matchesApis = !requiredApis.find((api) => !exampleApis.has(api));
    const examplePermissions = new Set(example.permissions);
    const matchesPermissions = !requiredPermissions.find(
      (api) => !examplePermissions.has(api),
    );
    const examplePackages = new Set(example.packages);
    const matchesPackages = !requiredPackages.find(
      (api) => !examplePackages.has(api),
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
        <div class="checkbox-col">
          <div class="header">Filter by APIs</div>
          <p v-for="api in exampleMetadata?.allApis">
            <input
              type="checkbox"
              :checked="selectedApis[api]"
              @input="toggleApi(api)"
            />
            <span>{{ api }}</span>
          </p>
        </div>
        <div class="divide-x" />
        <div class="checkbox-col">
          <div class="header">Filter by Permissions</div>
          <p v-for="permission in exampleMetadata?.allPermissions">
            <input
              type="checkbox"
              :checked="selectedPermissions[permission]"
              @input="togglePermission(permission)"
            />
            <span>{{ permission }}</span>
          </p>
        </div>
        <div class="divide-x" />
        <div class="checkbox-col">
          <div class="header">Filter by Packages</div>
          <p v-for="pkg in exampleMetadata?.allPackages">
            <input
              type="checkbox"
              :checked="selectedPackages[pkg]"
              @input="togglePackage(pkg)"
            />
            <span>{{ pkg }}</span>
          </p>
        </div>
      </div>
    </div>
    <p v-if="exampleMetadata == null">Loading examples...</p>
    <template v-else>
      <div class="search-results">
        <div v-for="example of filteredExamples">
          <a class="example" :href="example.url" target="_blank">
            <p class="name">{{ example.name }}</p>
            <p class="description">{{ example.description }}</p>
          </a>
        </div>
      </div>
      <p v-if="filteredExamples.length === 0">No matching examples</p>
    </template>
  </div>
</template>

<style scoped>
div,
p,
a {
  padding: 0;
  margin: 0;
  min-width: 0;
  text-decoration: none;
}

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
.example {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: var(--vp-custom-block-info-bg);
  border-radius: 8px;
  color: var(--vp-c-text-1) !important;
}
.example:hover {
  outline: 2px solid var(--vp-c-brand-2);
}
.example .name {
  font-size: 16px;
  font-weight: 500;
  padding-bottom: 8px;
}
.example .description {
  opacity: 70%;
  font-size: 14px;
  font-weight: normal;
  line-height: 120%;
}
</style>
