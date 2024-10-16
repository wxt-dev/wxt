<script lang="ts" setup>
const props = defineProps<{
  patterns: Array<[intput: string, output: string]>;
}>();
</script>

<template>
  <table class="no-vertical-dividers">
    <thead>
      <tr>
        <th style="width: 100%">Filename</th>
        <th></th>
        <th>Output Path</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="pattern of patterns">
        <td style="white-space: nowrap; padding-right: 8px">
          <code>entrypoints/{{ pattern[0] }}</code>
        </td>
        <td style="padding: 6px; opacity: 50%">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M4 11v2h12l-5.5 5.5l1.42 1.42L19.84 12l-7.92-7.92L10.5 5.5L16 11H4Z"
            />
          </svg>
        </td>
        <td style="white-space: nowrap; padding-left: 8px">
          <code>/{{ pattern[1] }}</code>
        </td>
      </tr>
    </tbody>
  </table>
</template>
