<script lang="ts" setup>
defineProps<{
  name: string;
  icon?: string;
}>();
</script>

<template>
  <img
    :src="`https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/${
      name?.toLowerCase() ?? icon
    }.svg`"
    :alt="`${name} Logo`"
  />
</template>

<style scoped>
img {
  display: inline;
  transform: translateY(5px);
  margin-right: 8px;
  width: 20px;
}
</style>
