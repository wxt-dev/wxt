<script lang="ts" setup>
import { computed } from 'vue';
import { data, type Post } from '../loaders/blog.data';
import BlogPostPreview from './BlogPostPreview.vue';

const posts = computed<Post[]>(() =>
  data
    .map((post) => ({
      ...post,
      ...post.frontmatter,
      date: new Date(post.frontmatter.date),
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime()),
);
</script>

<template>
  <div class="container">
    <div>
      <div class="vp-doc">
        <h1>Blog</h1>
      </div>

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
}

h1 {
  padding-bottom: 16px;
}

ul {
  display: flex;
  flex-direction: column;
  list-style: none;
}

ul li {
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid var(--vp-c-default-2);
}

ul li:last-child {
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--vp-c-default-1);
}
</style>
