# Examples

Simple walkthroughs to accomplish common tasks or patterns with WXT.

<script lang="ts" setup>
import { ref, onMounted } from 'vue';

const examples = ref()
onMounted(async () => {
    const res = await fetch("https://raw.githubusercontent.com/wxt-dev/wxt-examples/main/examples.json");
    examples.value = await res.json();
})

</script>

<ul>
    <li v-if="examples == null">
        Loading...
    </li>
    <template v-else>
        <li v-for="example of examples">
        <a :href="example.url" target="_blank">{{ example.name }}</a>
        </li>
    </template>
</ul>

> Full code available at [`wxt-dev/wxt-examples`](https://github.com/wxt-dev/wxt-examples)
