<script lang="ts" setup>
const props = defineProps<{
  author: {
    name: string;
    github: string;
  };
}>();
</script>

<template>
  <li>
    <a :href="`https://github.com/${author.github}`">
      <img :src="`https://github.com/${author.github}.png`" alt="profile" />
      <span>{{ author.name }}</span>
    </a>
  </li>
</template>

<style scoped>
a {
  display: flex;
  gap: 8px;
  align-items: center;
}
a:hover {
  text-decoration: underline;
}

img {
  width: 24px;
  height: 24px;
  border-radius: 100%;
}
</style>
