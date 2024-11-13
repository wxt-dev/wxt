// https://github.com/antfu-collective/taze?tab=readme-ov-file#config-file
export default {
  exclude: [
    // Very touchy, don't change:
    'typedoc',
    'typedoc-plugin-markdown',
    'typedoc-vitepress-theme',
    // Manually manage version so a single version is used:
    'esbuild',
    // Maintained manually to match min-node version
    '@types/node',
  ],
};
