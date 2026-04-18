<script lang="ts" setup>
import useBlogDate from '../composables/useBlogDate';

const props = defineProps<{
  post: {
    title: string;
    description?: string;
    date: Date;
    url: string;
    authors: Array<{ name: string; github: string }>;
  };
}>();

const date = useBlogDate(() => props.post.date);
</script>

<template>
  <li class="blog-list-item">
    <a :href="post.url" class="post-link">
      <div class="vp-doc">
        <h3 class="title" v-html="post.title" />
        <p class="description" v-html="post.description" />
        <p class="meta">
          {{ post.authors.map((author) => author.name).join(', ') }}
          &bull;
          {{ date }}
        </p>
      </div>
    </a>
  </li>
</template>

<style scoped>
.post-link .vp-doc {
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 16px;
  transition: background 0.2s;

  &:hover {
    /*noinspection CssUnresolvedCustomProperty*/
    background: var(--vp-c-default-3);
  }

  .title {
    /*noinspection CssUnresolvedCustomProperty*/
    color: var(--vp-c-text-1);
    margin-bottom: 12px;
  }

  .description {
    font-size: 16px;
    /*noinspection CssUnresolvedCustomProperty*/
    color: var(--vp-c-text-2);
    margin-bottom: 8px;
  }

  .meta {
    font-weight: 400;
    font-size: 12px;
    /*noinspection CssUnresolvedCustomProperty*/
    color: var(--vp-c-text-2);
  }
}
</style>
