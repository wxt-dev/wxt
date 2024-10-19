import { defineConfig, presetUno } from 'unocss';

export default defineConfig({
  content: {
    pipeline: {
      include: [
        // the default
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        // include js/ts files
        'src/entrypoints/**/*.{js,ts}',
      ],
      // exclude files
      // exclude: []
    },
  },
  presets: [presetUno()],
});
