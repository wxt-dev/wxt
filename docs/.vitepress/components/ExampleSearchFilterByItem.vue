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
  <div class="filter-container">
    <p class="header">
      <span>Filter by {{ label }}</span> <span v-if="count">({{ count }})</span>
    </p>
    <div class="scroll-container">
      <ul>
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
    </div>
  </div>
</template>

<style scoped>
.filter-container {
  height: 300px;
  display: flex;
  flex-direction: column;
  background: var(--vp-c-bg-soft);
}

.scroll-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.scroll-container ul {
  position: absolute;
  overflow-y: auto;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: small;
  padding: 8px 16px 16px 16px;
}

.header {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: bold;
  opacity: 50%;
}
label {
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
