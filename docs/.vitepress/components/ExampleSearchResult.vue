<script lang="ts" setup>
import { Example } from '../utils/types';

const props = defineProps<{
  example: Example;
}>();
</script>

<template>
  <li>
    <a class="example" :href="example.url" target="_blank">
      <p class="name">{{ example.name }}</p>
      <p class="description">{{ example.description }}</p>
    </a>
  </li>
</template>

<style scoped>
* {
  min-width: 0;
}
a {
  padding: 16px;
  display: flex;
  flex-direction: column;
  background: var(--vp-custom-block-info-bg);
  border-radius: 8px;
  color: var(--vp-c-text-1) !important;
  gap: 8px;
}

a:hover {
  outline: 2px solid var(--vp-c-brand-2);
}
.name {
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;

  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.description {
  height: 54px;
  opacity: 70%;
  font-size: 14px;
  font-weight: normal;
  line-height: 120%;
  min-height: 0;

  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
