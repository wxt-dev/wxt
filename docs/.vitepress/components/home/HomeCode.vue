<script lang="ts" setup>
import { computed } from 'vue';

import { highlight } from './highlight';

const props = defineProps<{
  source: string;
}>();

const lines = computed(() => highlight(props.source));
</script>

<template>
  <pre class="hw-code"><code><span
    v-for="(line, i) in lines"
    :key="i"
    class="hw-ln"
  ><span class="hw-num">{{ i + 1 }}</span><span
      v-for="(token, j) in line"
      :key="j"
      :class="token.cls"
    >{{ token.text }}</span></span></code></pre>
</template>
