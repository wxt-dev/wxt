<script lang="ts" setup>
import { computed } from 'vue';
// @ts-expect-error: Vitepress data-loader magic, this import is correct
import { data } from '../loaders/blog.data';
import BlogTag from './BlogTag.vue';
import BlogPostPreview from './BlogPostPreview.vue';
import { useActiveTag } from '../composables/useActiveTag';

const tags = [
  ...data.reduce((set, post) => {
    post.frontmatter.tags?.forEach((tag) => set.add(tag));
    return set;
  }, new Set()),
];

const activeTag = useActiveTag();

const posts = computed(() =>
  data
    .filter(
      (post) =>
        activeTag.value == null ||
        post.frontmatter.tags.includes(activeTag.value),
    )
    .map((post) => ({
      ...post,
      ...post.frontmatter,
      date: new Date(post.frontmatter.date),
    })),
);
</script>

<template>
  <div class="container">
    <div>
      <h1>Blog</h1>

      <ul class="tags-list">
        <BlogTag v-for="tag of tags" :key="tag" :tag="tag" />
      </ul>

      <ul>
        <BlogPostPreview v-for="post of posts" :key="post.url" :post />
      </ul>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.container > div {
  padding: 32px;
  max-width: 900px;
  width: 100%;
  min-width: 0;
}

h1 {
  line-height: 100% !important;
  font-size: 48px;
  font-weight: 400;
  padding-bottom: 16px;
}

.tags-list {
  padding-bottom: 64px;
}

ul {
  display: flex;
  list-style: none;
}
ul,
li {
  padding: 0;
  margin: 0;
}
</style>
