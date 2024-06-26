<script lang="ts" setup>
import { computed, toRaw } from 'vue';
import { KeySelectedObject } from '../utils/types';

const props = defineProps<{
  label: string;
  items?: string[];
}>();

const selectedItems = defineModel<KeySelectedObject>({
  required: true,
});

const count = computed(() => {
  return Object.values(toRaw(selectedItems.value)).filter(Boolean).length;
});

function toggleItem(pkg: string) {
  selectedItems.value = {
    ...toRaw(selectedItems.value),
    [pkg]: !selectedItems.value[pkg],
  };
}
</script>

<template>
  <ul>
    <li class="header">
      <span>Filter by {{ label }}</span> <span v-if="count">({{ count }})</span>
    </li>
    <li v-for="item in items">
      <label :title="item">
        <input
          type="checkbox"
          :checked="selectedItems[item]"
          @input="toggleItem(item)"
        />
        <span>{{ item }}</span>
      </label>
    </li>
  </ul>
</template>

<style scoped>
ul {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  max-height: 200px;
  font-size: 14px;
  gap: 4px;
  padding-bottom: 16px;
}
.header {
  padding: 8px 16px 4px 16px;
  font-size: 12px;
  font-weight: bold;
  position: sticky;
  top: 0;
  left: 0;
  background: var(--vp-custom-block-info-bg);
}
.header span {
  opacity: 50%;
}
label {
  margin: 0 16px;
  display: flex;
  gap: 4px;
  align-items: flex-start;
  text-wrap: wrap;
  overflow-wrap: anywhere;
  line-height: 140%;
  cursor: pointer;
  text-wrap: nowrap;
}
span {
  padding-top: 1px;
}
input[type='checkbox'] {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
</style>
