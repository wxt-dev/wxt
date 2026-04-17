<script lang="ts" setup>
import { computed } from 'vue';
// @ts-expect-error: Vitepress data-loader magic, this import is correct
import { data } from '../loaders/blog.data';
import BlogPostPreview from './BlogPostPreview.vue';

const posts = computed(() =>
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
    <div class="inner-container">
      <h1>Blog</h1>

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

  .inner-container {
    padding: 32px;
    max-width: 900px;
    width: 100%;

    h1 {
      padding-bottom: 16px;
    }

    ul {
      display: flex;
      flex-direction: column;

      li {
        padding-top: 16px;
        margin-top: 16px;
        /*noinspection CssUnresolvedCustomProperty*/
        border-top: 1px solid var(--vp-c-divider);

        &:last-child {
          padding-bottom: 16px;
          margin-bottom: 16px;
          /*noinspection CssUnresolvedCustomProperty*/
          border-bottom: 1px solid var(--vp-c-divider);
        }
      }
    }
  }
}
</style>
