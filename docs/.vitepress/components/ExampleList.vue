<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';

const props = defineProps<{
  tag?: string;
}>();

const examples = ref();
onMounted(async () => {
  const res = await fetch(
    'https://raw.githubusercontent.com/wxt-dev/wxt-examples/main/examples.json',
  );
  examples.value = await res.json();
});

const filteredExamples = computed(() => {
  if (props.tag == null) return examples.value;

  return examples.value.filter((example) => {
    return example.tags?.includes(props.tag);
  });
});
</script>

<template>
  <ul>
    <li v-if="examples == null">Loading...</li>
    <template v-else>
      <li v-for="example of filteredExamples">
        <a :href="example.url" target="_blank">{{ example.name }}</a>
      </li>
    </template>
  </ul>
</template>
