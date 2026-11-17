import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/vite-plugin-svelte').SvelteConfig} */
export default {
  // Used by `svelte-check` (`--config` stops it crawling parent vite.config
  // files when this template is type-checked inside the monorepo). WXT's
  // module sets `configFile: false` at build time and configures the plugin
  // itself — importing a project svelte.config.js used to segfault.
  preprocess: [vitePreprocess()],
};
