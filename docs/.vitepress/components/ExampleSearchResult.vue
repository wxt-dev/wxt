<script lang="ts" setup>
import { Example } from '../utils/types';

const props = defineProps<{
  example: Example;
}>();
</script>

<template>
  <li>
    <a :href="example.url" target="_blank">
      <p class="name">{{ example.name }}</p>
      <p class="description">{{ example.description }}</p>
      <p class="link">Open &rarr;</p>
    </a>
  </li>
</template>

<style scoped>
a {
  padding: 16px;
  display: flex;
  flex-direction: column;
  /*noinspection CssUnresolvedCustomProperty*/
  border: 2px solid var(--vp-c-bg-soft);
  border-radius: 16px;
  gap: 8px;

  &:hover {
    outline: 2px solid var(--vp-c-brand);

    .link {
      opacity: 100%;
    }
  }

  .name {
    font-weight: 500;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  .description {
    opacity: 70%;
    font-size: 14px;
    line-height: 130%;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .link {
    opacity: 0;
    transition: 250ms;
    color: var(--vp-c-brand);
    font-weight: bold;
    text-align: right;
  }
}
</style>
