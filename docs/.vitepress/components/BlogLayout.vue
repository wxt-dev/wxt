<script lang="ts" setup>
import useBlogDate from '../composables/useBlogDate';
import { useData } from 'vitepress';

const { frontmatter } = useData();
const date = useBlogDate(() => frontmatter.value.date);
</script>

<template>
  <div>
    <main class="container">
      <h1 v-html="$frontmatter.title" />
      <p class="meta-row">
        <a
          class="author"
          v-for="author of $frontmatter.authors"
          :key="author.github"
          :href="`https://github.com/${author.github}`"
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
.container {
  max-width: 1080px;
  padding: 32px;
  margin: auto;

  @media (min-width: 768px) {
    padding: 64px;
  }

  .meta-row {
    display: flex;
    /*noinspection CssUnresolvedCustomProperty*/
    color: var(--vp-c-text-2);
    gap: 16px;
    overflow: hidden;
    padding-bottom: 32px;

    .author {
      display: flex;
      gap: 8px;

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
