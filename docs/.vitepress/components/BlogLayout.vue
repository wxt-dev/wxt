<script lang="ts" setup>
import useBlogDate from '../composables/useBlogDate';
import { Content, useData } from 'vitepress';
import type { PostFrontmatter } from '../loaders/blog.data';

const { frontmatter } = useData<PostFrontmatter>();
const date = useBlogDate(() => frontmatter.value.date);
</script>

<template>
  <div class="vp-doc">
    <main class="container-content">
      <h1 v-html="frontmatter.title" />
      <p class="meta-row">
        <a
          v-for="author of frontmatter.authors"
          :key="author.github"
          :href="`https://github.com/${author.github}`"
          class="author"
        >
          <img
            :src="`https://github.com/${author.github}.png?size=96`"
            alt="author avatar"
          />
          <span>{{ author.name }}</span>
        </a>
        <span>&bull;</span>
        <span>{{ date }}</span>
      </p>
      <Content />
    </main>
  </div>
</template>

<style scoped>
.vp-doc {
  display: flex;
}

main {
  max-width: 1080px;
  padding: 32px;
  margin: auto;
}
@media (min-width: 768px) {
  main {
    padding: 64px;
  }
}

.meta-row {
  display: flex;
  color: var(--vp-c-text-2);
  gap: 16px;
  overflow: hidden;
  padding-bottom: 32px;
}

.meta-row > * {
  flex-shrink: 0;
}

.author {
  display: flex;
  gap: 8px;
  align-items: center;
  color: var(--vp-c-text-2);
  font-weight: normal;
  text-decoration: none;
}

.author img {
  width: 24px;
  height: 24px;
  border-radius: 100%;
}

.author span {
  padding: 0;
  margin: 0;
}

.author:hover {
  text-decoration: underline;
  color: var(--vp-c-text-2);
}
</style>
