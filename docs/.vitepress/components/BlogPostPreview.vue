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
    <a :href="post.url">
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
.vp-doc {
  * {
    margin-block: 10px;
  }

  .title {
    color: var(--vp-c-text-1);
  }

  .description {
    color: var(--vp-c-text-2);
  }

  .meta {
    font-weight: 400;
    font-size: 12px;
    color: var(--vp-c-text-2);
  }
}
</style>
