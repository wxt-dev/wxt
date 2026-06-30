<script lang="ts" setup>
import { Ref } from 'vue';
import useBlogDate from '../composables/useBlogDate';
import { Content, useData } from 'vitepress';
import { PostFrontmatter } from '../utils/types';

const { frontmatter } = useData() as unknown as {
  frontmatter: Ref<PostFrontmatter>;
};

const date = useBlogDate(() => frontmatter.value.date);
</script>

<template>
  <div class="vp-doc">
    <main class="container">
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
            alt="Author's avatar"
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

  .container {
    max-width: 1080px;
    padding: 32px;
    margin: auto;

    @media (min-width: 768px) {
      padding: 64px;
    }
  }

  .meta-row {
    display: flex;
    color: var(--vp-c-text-2);
    gap: 16px;
    overflow: hidden;
    padding-bottom: 32px;

    .author {
      display: flex;
      gap: 8px;
      align-items: center;
      color: var(--vp-c-text-2);
      font-weight: normal;
      text-decoration: none;

      :hover {
        text-decoration: underline;
      }

      img {
        width: 24px;
        border-radius: 100%;
      }
    }
  }
}
</style>
