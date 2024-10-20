<script lang="ts" setup>
import { useRouter } from 'vitepress/client';
import { useActiveTag } from '../composables/useActiveTag';

defineProps<{
  tag: string;
}>();

const activeTag = useActiveTag();

const router = useRouter();
function toggleTag(tag: string) {
  router.go(activeTag.value === tag ? '/blog' : `/blog?tag=${tag}`);
}
</script>

<template>
  <li>
    <button
      @click="toggleTag(tag)"
      :class="{
        active: activeTag === tag,
      }"
    >
      {{ tag }}
    </button>
  </li>
</template>

<style scoped>
button {
  font-size: 14px;
  padding: 4px 12px;
  border: 1px solid var(--vp-c-default);
  border-radius: 4px;
  transition: all 250ms ease;
}
button:hover {
  border: 1px solid var(--vp-c-default-2);
  background: var(--vp-c-default);
}
button.active,
button.active:hover {
  border: 1px solid var(--vp-c-brand);
  color: var(--vp-c-brand);
  background: transparent;
}
</style>
