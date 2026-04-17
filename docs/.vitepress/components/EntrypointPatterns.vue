<script lang="ts" setup>
defineProps<{
  patterns: Array<[intput: string, output: string]>;
}>();
</script>

<template>
  <table class="no-vertical-dividers entrypoint-patterns">
    <thead>
      <tr>
        <th class="col-filename">Filename</th>
        <th></th>
        <th>Output Path</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="pattern of patterns" :key="pattern[0]">
        <td class="cell-input">
          <code>entrypoints/{{ pattern[0] }}</code>
        </td>
        <td class="cell-arrow">
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
        <td class="cell-output">
          <code>/{{ pattern[1] }}</code>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.entrypoint-patterns {
  width: 100%;

  .col-filename {
    width: 100%;
  }

  .cell-input {
    white-space: nowrap;
    padding-right: 8px;
  }

  .cell-arrow {
    padding: 6px;
    opacity: 0.5;
  }

  .cell-output {
    white-space: nowrap;
    padding-left: 8px;
  }
}
</style>
