<script lang="ts" setup>
import BlogTag from './BlogTag.vue';
import BlogAuthor from './BlogAuthor.vue';
import { computed } from 'vue';

const props = defineProps<{
  post: {
    title: string;
    description?: string;
    date: Date;
    url: string;
    tags: string[];
    authors: Array<{ name: string; github: string }>;
  };
}>();

const monthFormatter = new Intl.DateTimeFormat(navigator.language, {
  month: 'long',
});
const date = computed(
  () =>
    `${monthFormatter.format(props.post.date)} ${props.post.date.getDate()}, ${props.post.date.getFullYear()}`,
);
</script>

<template>
  <li>
    <div class="left-column">
      <p class="date">
        {{ date }}
      </p>
      <ul>
        <BlogTag v-for="tag of post.tags" :key="tag" :tag />
      </ul>
    </div>

    <div class="vertical-divider" />

    <a class="right-column" :href="post.url">
      <p class="title">{{ post.title }}</p>
      <p class="description">{{ post.description }}</p>
    </a>
  </li>
</template>

<style scoped>
ul {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  list-style: none;
}
ul,
li {
  padding: 0;
  margin: 0;
}

li {
  display: flex;
  gap: 32px;
}
.date {
  color: var(--vp-c-text-2);
}
.left-column {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.vertical-divider {
  width: 1px;
  background-color: var(--vp-c-default-1);
}
.right-column {
  flex: 1;
  text-decoration: none;
  color: var(--vp-c-text);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.right-column:hover {
  color: var(--vp-c-text);
}
.right-column .title {
  font-weight: 600;
  font-size: 28px;
  color: var(--vp-c-text);
}
.right-column .description {
  font-weight: 400;
  font-size: 16px;
  color: var(--vp-c-text-2);
}
</style>
