<script lang="ts" setup>
import { computed } from 'vue';

const { name, icon } = defineProps<{
  name: string;
  icon?: string;
}>();

const src = computed(() => {
  if (icon) return icon;
  return `https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/${name.toLowerCase()}.svg`;
});
</script>

<template>
  <img :alt="`${name} Logo`" :src="src" />
</template>

<style scoped>
img {
  display: inline;
  transform: translateY(5px);
  margin-right: 8px;
  width: 20px;
}
</style>
